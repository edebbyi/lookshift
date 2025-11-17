import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Create Supabase client for database operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-28eb400b/health", (c) => {
  return c.json({ status: "ok" });
});

// Lightweight proxy endpoint - just forwards to Gemini API
app.post("/make-server-28eb400b/generate-image", async (c) => {
  try {
    // Get access token from Authorization header
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized: No access token provided' }, 401);
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return c.json({ error: 'Unauthorized: Invalid access token' }, 401);
    }

    // Get request body - expect the full Gemini payload
    const geminiPayload = await c.req.json();

    console.log(`📥 PROXY REQUEST - User: ${user.id}`);

    // Fetch user's API key from user_settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('nano_bonana_api_key')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings?.nano_bonana_api_key) {
      console.error('Error fetching API key:', settingsError);
      return c.json({ 
        error: 'API key not found. Please update your settings.' 
      }, 400);
    }

    const apiKey = settings.nano_bonana_api_key;

    // Simply forward the request to Gemini API
    console.log(`🌐 Forwarding to Gemini API...`);
    
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiPayload),
      }
    );

    console.log(`📡 Gemini response status: ${geminiResponse.status}`);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      
      return c.json({ 
        error: 'Gemini API error',
        status: geminiResponse.status,
        message: errorText 
      }, geminiResponse.status);
    }

    // Forward the response directly back to client
    const geminiData = await geminiResponse.json();
    return c.json(geminiData);

  } catch (error: any) {
    console.error('Error in proxy endpoint:', error);
    return c.json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    }, 500);
  }
});

// New generate-looks endpoint (FormData-based, batch processing)
app.post("/make-server-28eb400b/generate-looks", async (c) => {
  try {
    // Get access token from Authorization header
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized: No access token provided' }, 401);
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return c.json({ error: 'Unauthorized: Invalid access token' }, 401);
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // Get user's Gemini API key
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('nano_bonana_api_key')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      return c.json({ error: 'Failed to fetch API key configuration' }, 500);
    }

    const apiKey = userSettings?.nano_bonana_api_key;

    if (!apiKey) {
      return c.json({ error: 'No Gemini API key configured for this user' }, 400);
    }

    console.log(`🔑 Using API key (length: ${apiKey.length})`);

    // Parse FormData
    const formData = await c.req.formData();
    const bodyType = formData.get('body_type') as string;

    if (!bodyType) {
      return c.json({ error: 'Missing body_type parameter' }, 400);
    }

    console.log(`📥 Body type requested: ${bodyType}`);

    // Get all files
    const files = formData.getAll('files');
    
    if (files.length === 0) {
      return c.json({ error: 'No outfit images provided' }, 400);
    }

    console.log(`📸 Processing ${files.length} image(s)`);

    // Helper function to convert File to base64
    const fileToBase64 = async (file: File): Promise<string> => {
      const buf = await file.arrayBuffer();
      const uint8 = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      return btoa(binary);
    };

    const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
    const outputs: { index: number; imageBase64: string; mimeType: string }[] = [];

    // Helper function to add delay between API calls
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Process each file with controlled concurrency to avoid timeouts and rate limits
    const BATCH_SIZE = 2; // Process 2 images at a time max
    const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches

    for (let batchStart = 0; batchStart < files.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, files.length);
      const batch = files.slice(batchStart, batchEnd);

      console.log(`🔄 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (images ${batchStart + 1}-${batchEnd})`);

      // Process batch in parallel
      const batchPromises = batch.map(async (file, batchIndex) => {
        const i = batchStart + batchIndex;
        const fileObj = file as File;

        console.log(`🎨 Processing image ${i + 1}/${files.length} (${fileObj.name}, ${fileObj.type}, ${fileObj.size} bytes)`);

        try {
          // Convert to base64
          const base64Image = await fileToBase64(fileObj);
          const mimeType = fileObj.type || 'image/jpeg';

          // --- REVISED PROMPT MODIFICATION START ---
          let prompt = '';
          const lowerBodyType = bodyType.toLowerCase();

          if (lowerBodyType.includes('extra small') || lowerBodyType.includes('xs')) {
            prompt = `**Role: Professional, high-end fashion retoucher.** High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a **size XS**, making her thinner but maintaining her original height. Make her visibly thinner with a tiny waist, minimal curves, and slender limbs. **It is absolutely critical to keep the clothing identical in style, type, and color, with NO alterations to the garment's design.** The outfit must be rendered as a **perfectly fitted size XS garment**, proportional to her new body shape, not loose. You must maintain the model's position, composition, background, facial features, hair color, skin tone, and any text or logos on the clothing or in the background identical.`;
          } else if (lowerBodyType.includes('small') || lowerBodyType.includes('size s')) {
            prompt = `**Role: Professional, high-end fashion retoucher.** High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a **size S**, making her slimmer but maintaining her original height. Make her visibly slender and athletic, with narrow shoulders and **subtle, natural curves**. **It is absolutely critical to keep the clothing identical in style, type, and color, with NO alterations to the garment's design.** The outfit must be rendered as a **perfectly fitted size S garment**, with a tailored silhouette appropriate for her new body. You must maintain the model's position, composition, background, facial features, hair color, skin tone, and any text or logos on the clothing or in the background identical.`;
          } else if (lowerBodyType.includes('plus-size') || lowerBodyType.includes('extra-large') || lowerBodyType.includes('xl')) {
            prompt = `**Role: Professional, high-end fashion retoucher.** High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a curvy, plus-size XL. **Increase her overall scale** to make her appear bigger in the frame, including increasing her apparent height slightly to match a larger size. Make her visibly and significantly fuller and wider: give her broad shoulders, thick arms, wider wrists, a fuller bust, a wide waist, curvy hips, and thick thighs and legs. **It is absolutely critical to keep the clothing identical in style, type, and color, with NO alterations to the garment's design.** The outfit must be rendered as a **size XL garment**, appearing stretched and tightly fitted over her curves. You must maintain the model's position, composition, background, hair color, skin tone, and any text or logos on the clothing or in the background identical.`;
          } else {
            prompt = `**Role: Professional, high-end fashion retoucher.** High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a ${bodyType} body type, adjusting her scale to match. **It is absolutely critical to keep the clothing identical in style, type, and color, with NO alterations to the garment's design.** The outfit must be rendered in the size appropriate for the new body type. You must maintain the model's position, composition, background, facial features, hair color, skin tone, and any text or logos on the clothing or in the background identical.`;
          }
          // --- REVISED PROMPT MODIFICATION END ---

          console.log(`📝 Using prompt for image ${i + 1}`);
          console.log(`📤 Sending image as: ${mimeType}`);

          const payload = {
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          };

          console.log(`🌐 Calling Gemini API for image ${i + 1}...`);

          // Add timeout for fetch request (50 seconds)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 50000);

          try {
            const geminiRes = await fetch(GEMINI_ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log(`📡 Gemini response status for image ${i + 1}: ${geminiRes.status}`);

            if (!geminiRes.ok) {
              const errText = await geminiRes.text();
              console.error(`❌ Gemini error for image ${i + 1}:`, geminiRes.status, errText);
              throw new Error(`Gemini API error: ${geminiRes.status} - ${errText}`);
            }

            const geminiJson = await geminiRes.json();
            console.log(`📦 Gemini response received for image ${i + 1}`);

            // Extract the generated image
            const candidates = geminiJson.candidates ?? [];
            const first = candidates[0]?.content?.parts ?? [];
            const imagePart = first.find((p: any) => p.inlineData?.data);

            if (!imagePart) {
              console.error(`❌ No inlineData in Gemini response for image ${i + 1}:`, geminiJson);
              throw new Error('No image returned from Gemini');
            }

            const generatedBase64 = imagePart.inlineData.data as string;
            const generatedMimeType = imagePart.inlineData.mimeType || 'image/png';

            console.log(`✅ Successfully generated image ${i + 1} (${generatedMimeType})`);

            return {
              index: i,
              imageBase64: generatedBase64,
              mimeType: generatedMimeType,
            };
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
              throw new Error(`Request timeout for image ${i + 1}`);
            }
            throw fetchError;
          }
        } catch (error: any) {
          console.error(`❌ Error processing image ${i + 1}:`, error);
          throw new Error(`Failed to process image ${i + 1}: ${error.message}`);
        }
      });

      try {
        const batchResults = await Promise.all(batchPromises);
        outputs.push(...batchResults);
      } catch (error: any) {
        console.error('❌ Batch processing failed:', error);
        return c.json({ 
          error: 'Image generation failed',
          message: error.message || 'Failed to generate one or more images',
          processedCount: outputs.length
        }, 500);
      }

      // Add delay between batches to avoid rate limiting (except for the last batch)
      if (batchEnd < files.length) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log(`🎉 Successfully generated ${outputs.length} image(s)`);

    return c.json({ 
      success: true,
      images: outputs 
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in generate-looks:', error);
    return c.json({ 
      error: 'Internal server error',
      message: error.message || String(error)
    }, 500);
  }
});

Deno.serve(app.fetch);
