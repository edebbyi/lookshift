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

// Generate image endpoint
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

    // Get request body
    const body = await c.req.json();
    const { imageBase64, mimeType, bodyType } = body;

    console.log(`📥 INCOMING REQUEST - Body Type: "${bodyType}"`);

    if (!imageBase64 || !mimeType || !bodyType) {
      return c.json({ 
        error: 'Bad Request: Missing required fields (imageBase64, mimeType, bodyType)' 
      }, 400);
    }

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

    // Map body type to description (still useful for the 'else' case)
    const bodyTypeDescriptions: Record<string, string> = {
      xs: "extra small/petite",
      m: "medium/average",
      xl: "extra large/plus-size",
    };

    const bodyDescription = bodyTypeDescriptions[bodyType] || bodyType;

    // Log the body type being processed
    console.log(`🎯 Generating image for body type: ${bodyType} (${bodyDescription})`);

    // --- REVISED PROMPT MODIFICATION START ---
    let promptText = '';
    
    if (bodyType === 'xs') {
      promptText = `High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a **waif-like, size XS**. **Decrease her overall scale** to make her appear significantly smaller in the frame. Make her visibly thinner with a tiny waist, minimal curves, and frail limbs. The outfit must be rendered as a **size XS garment**, appearing clearly loose and oversized on her new body shape. You must maintain the model's position, composition, background, facial features, hair color, skin tone, **and any text or logos on the clothing or in the background identical**.`;
    } else if (bodyType === 'm') {
      promptText = `High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a **medium, size M**. Make her appear with balanced proportions and **natural, moderate curves**. The outfit must be rendered as a **size M garment**, with a well-fitted silhouette that's neither too loose nor too tight on her body. You must maintain the model's position, composition, background, facial features, hair color, skin tone, **and any text or logos on the clothing or in the background identical**.`;
    } else if (bodyType === 'xl') {
      promptText = `High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a curvy, plus-size XL. **Increase her overall scale** to make her appear bigger in the frame. Make her visibly and significantly fuller and wider: give her broad shoulders, thick arms, wider wrists, a fuller bust, a wide waist, curvy hips, and thick thighs and legs. The outfit must be rendered as a **size XL garment**, appearing stretched and tightly fitted over her curves. You must maintain the model's position, composition, background, hair color, skin tone, **and any text or logos on the clothing or in the background identical**.`;
    } else {
      promptText = `High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a ${bodyDescription} body type, adjusting her scale to match. The outfit must be rendered in the size appropriate for the new body type. You must maintain the model's position, composition, background, facial features, hair color, skin tone, **and any text or logos on the clothing or in the background identical**.`;
    }
    // --- REVISED PROMPT MODIFICATION END ---

    console.log(`📝 Using prompt: ${promptText}`);

    // Call Gemini API using REST endpoint
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
    
    console.log(`🌐 Calling Gemini API at: ${geminiUrl}`);
    console.log(`🔑 API Key length: ${apiKey.length}, First 10 chars: ${apiKey.substring(0, 10)}...`);
    console.log(`🖼️ Image data length: ${imageBase64.length}, MIME type: ${mimeType}`);
    
    let geminiResponse;
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          }],
        }),
      });
    } catch (fetchError: any) {
      console.error('❌ Fetch error:', fetchError);
      console.error('❌ Fetch error message:', fetchError.message);
      console.error('❌ Fetch error stack:', fetchError.stack);
      return c.json({ 
        error: 'Failed to connect to Gemini API',
        message: fetchError.message || 'Network error occurred',
        details: 'Please check your API key and network connection'
      }, 500);
    }

    console.log(`📡 Gemini response status: ${geminiResponse.status}`);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      
      // Parse error message for rate limiting
      if (geminiResponse.status === 429) {
        return c.json({ 
          error: 'Rate limit exceeded',
          retryAfter: 10,
          message: 'Too many requests. Please wait a moment and try again.'
        }, 429);
      }
      
      return c.json({ 
        error: 'Gemini API error',
        status: geminiResponse.status,
        message: errorText 
      }, geminiResponse.status);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API response:', JSON.stringify(geminiData, null, 2));

    // Extract generated image from response
    let generatedImageData = null;

    if (geminiData.candidates && geminiData.candidates.length > 0) {
      const candidate = geminiData.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            generatedImageData = {
              mimeType: part.inlineData.mimeType,
              data: part.inlineData.data,
            };
            break;
          }
        }
      }
    }

    if (!generatedImageData) {
      console.error('No image data in response:', geminiData);
      return c.json({ 
        error: 'No image generated',
        message: 'The API did not return an image. Please try again.'
      }, 500);
    }

    // Return the generated image data
    return c.json({
      success: true,
      image: generatedImageData,
    });

  } catch (error: any) {
    console.error('Error in generate-image endpoint:', error);
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

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File;

      console.log(`🎨 Processing image ${i + 1}/${files.length} (${file.name}, ${file.type}, ${file.size} bytes)`);

      // Convert to base64
      const base64Image = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      // --- REVISED PROMPT MODIFICATION START ---
      let prompt = '';
      const lowerBodyType = bodyType.toLowerCase();

      if (lowerBodyType.includes('extra small') || lowerBodyType.includes('xs')) {
        prompt = `High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a **waif-like, size XS**. **Decrease her overall scale** to make her appear significantly smaller in the frame. Make her visibly thinner with a tiny waist, minimal curves, and frail limbs. The outfit must be rendered as a **size XS garment**, appearing clearly loose and oversized on her new body shape. You must maintain the model's position, composition, background, facial features, hair color, skin tone, **and any text or logos on the clothing or in the background identical**.`;
      } else if (lowerBodyType.includes('medium') || lowerBodyType.includes('size m')) {
        prompt = `High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a **medium, size M**. Make her appear with balanced proportions and **natural, moderate curves**. The outfit must be rendered as a **size M garment**, with a well-fitted silhouette that's neither too loose nor too tight on her body. You must maintain the model's position, composition, background, facial features, hair color, skin tone, **and any text or logos on the clothing or in the background identical**.`;
      } else if (lowerBodyType.includes('plus-size') || lowerBodyType.includes('extra-large') || lowerBodyType.includes('xl')) {
        prompt = `High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a curvy, plus-size XL. **Increase her overall scale** to make her appear bigger in the frame. Make her visibly and significantly fuller and wider: give her broad shoulders, thick arms, wider wrists, a fuller bust, a wide waist, curvy hips, and thick thighs and legs. The outfit must be rendered as a **size XL garment**, appearing stretched and tightly fitted over her curves. You must maintain the model's position, composition, background, hair color, skin tone, **and any text or logos on the clothing or in the background identical**.`;
      } else {
        prompt = `High-quality fashion photography style. Critically important: Edit this photo to transform the model's body to a ${bodyType} body type, adjusting her scale to match. The outfit must be rendered in the size appropriate for the new body type. You must maintain the model's position, composition, background, facial features, hair color, skin tone, **and any text or logos on the clothing or in the background identical**.`;
      }
      // --- REVISED PROMPT MODIFICATION END ---


      console.log(`📝 Using prompt: "${prompt}"`);
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

      const geminiRes = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log(`📡 Gemini response status: ${geminiRes.status}`);

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error(`❌ Gemini error for image ${i + 1}:`, geminiRes.status, errText);
        return c.json({ 
          error: `Gemini API error for image ${i + 1}`,
          status: geminiRes.status,
          details: errText
        }, 500);
      }

      const geminiJson = await geminiRes.json();
      console.log(`📦 Gemini response structure:`, JSON.stringify(geminiJson, null, 2));

      // Extract the generated image
      const candidates = geminiJson.candidates ?? [];
      const first = candidates[0]?.content?.parts ?? [];
      const imagePart = first.find((p: any) => p.inlineData?.data);

      if (!imagePart) {
        console.error(`❌ No inlineData in Gemini response for image ${i + 1}:`, geminiJson);
        return c.json({ 
          error: `No image returned from Gemini for image ${i + 1}`,
          response: geminiJson
        }, 500);
      }

      const generatedBase64 = imagePart.inlineData.data as string;
      const generatedMimeType = imagePart.inlineData.mimeType || 'image/png';

      console.log(`✅ Successfully generated image ${i + 1} (${generatedMimeType})`);

      outputs.push({
        index: i,
        imageBase64: generatedBase64,
        mimeType: generatedMimeType,
      });
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
