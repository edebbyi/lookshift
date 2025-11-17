import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../contexts/AuthContext";
import { projectId } from "../utils/supabase/info";
import { BackgroundBlobs } from "../components/BackgroundBlobs";
import { UploadCard } from "../components/UploadCard";
import { BodyTypeSelector } from "../components/BodyTypeSelector";
import { GenerateButton } from "../components/GenerateButton";
import { PreviewCard } from "../components/PreviewCard";
import { ExpandedLookDialog } from "../components/ExpandedLookDialog";
import { LayoutToggle } from "../components/LayoutToggle";
import { UserMenu } from "../components/UserMenu";
import { signOut } from "../utils/supabase/auth";

interface Look {
  id: string;
  originalImage: string;
  generatedImage?: string;
  file?: File;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export function Dashboard() {
  const { accessToken } = useAuth();
  const [bodyType, setBodyType] = useState("m");
  const [looks, setLooks] = useState<Look[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedLook, setExpandedLook] = useState<Look | null>(null);
  const [expandedLookNumber, setExpandedLookNumber] = useState<number>(0);
  const [layout, setLayout] = useState<'sidebar' | 'topbar'>('topbar');

  // Calculate button states
  const hasCompletedLooks = looks.some(look => look.status === 'completed');
  const hasPendingLooks = looks.some(look => look.status === 'pending' || !look.status);

  const handleFilesUpload = (files: File[]) => {
    const remainingSlots = 6 - looks.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    const newLooks = filesToAdd.map((file, index) => ({
      id: `look-${Date.now()}-${index}`,
      originalImage: URL.createObjectURL(file),
      file: file,
      status: 'pending' as const,
    }));
    setLooks([...looks, ...newLooks]);
  };

  const handleGenerate = async () => {
    if (!accessToken) {
      toast.error("Not Authenticated", {
        description: "Please sign in to generate images.",
        duration: 4000,
      });
      return;
    }
    
    // Only generate looks that are pending (not already completed)
    const pendingLooks = looks.map((look, index) => ({ look, index }))
      .filter(({ look }) => look.status === 'pending' || !look.status);
    
    if (pendingLooks.length === 0) {
      toast.info("No Pending Looks", {
        description: "All looks have been generated. Use 'Regenerate All' to generate again.",
        duration: 4000,
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Mark all pending looks as processing
      const pendingIndices = pendingLooks.map(({ index }) => index);
      setLooks(prev => prev.map((l, idx) => 
        pendingIndices.includes(idx) ? { ...l, status: 'processing' as const } : l
      ));

      // Map body type to simple format
      let bodyTypeLabel = '';
      if (bodyType === 'xs') {
        bodyTypeLabel = 'extra small/petite, specifically size XS';
      } else if (bodyType === 'm') {
        bodyTypeLabel = 'medium/average, specifically size M';
      } else if (bodyType === 'xl') {
        bodyTypeLabel = 'plus-size, specifically size extra-large';
      } else {
        bodyTypeLabel = bodyType;
      }

      console.log(`🎯 Generating ${pendingLooks.length} looks with body type: ${bodyTypeLabel}`);

      // Process each image individually to avoid resource limits
      let successCount = 0;
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      for (let i = 0; i < pendingLooks.length; i++) {
        const { look, index } = pendingLooks[i];
        
        if (!look.file) continue;

        try {
          console.log(`🎨 Processing image ${i + 1}/${pendingLooks.length}`);

          // Convert file to base64
          const convertedFile = await convertFileToJpeg(look.file);
          const base64Image = await fileToBase64(convertedFile);
          const mimeType = convertedFile.type || 'image/jpeg';

          // Create the prompt on client side with improved prompts
          let promptText = '';
          
          if (bodyType === 'xs') {
            promptText = `**[GARMENT PRESERVATION - HIGHEST PRIORITY]**
The clothing MUST remain 100% identical: same style, cut, neckline, hem length, sleeve length, fabric drape, and coverage area. NO alterations to garment design. NO exposed midriff. NO shortened lengths. The garment simply scales proportionally smaller.

**CRITICAL DETAIL PRESERVATION:**
Preserve EXACTLY on all garments (especially pants):
- POCKETS: exact placement, size, style, stitching, flaps
- SEAMS: all seam lines in identical positions with same stitching
- HARDWARE: zippers, buttons, rivets, buckles - exact same style and placement
- BELT LOOPS: same number, spacing, and width
- WAISTBAND: identical construction and height
- FABRIC PATTERN: maintain exact patterns, prints, textures, weave
- STITCHING DETAILS: topstitching, decorative stitching must match exactly
- HEMS: same finish, fold, and detail
- Any LOGOS, LABELS, or TEXT on garments must be identical

**[BODY TRANSFORMATION]**
Professional fashion retouching task: Transform model to size XS/US 0-2 body type with these precise characteristics:
- Overall frame: Petite, delicate bone structure
- Shoulders: Narrow, approximately 14-15" across
- Bust: Small, minimal projection (32-34" circumference)
- Waist: Very defined, 23-25" circumference
- Hips: Narrow, 33-35" circumference, minimal curve
- Arms: Slender throughout, defined wrist bones
- Legs: Lean with visible muscle definition, thigh gap present
- Overall silhouette: Linear, minimal curves, athletic-slim

The clothing should fit as a perfectly tailored XS garment with appropriate ease - not loose, not tight.

**[CRITICAL REMINDER]**
This is a BODY TRANSFORMATION ONLY. The clothing has not been altered, redesigned, or changed in any way - it is simply being worn by a different sized body. Think of this as moving the same exact garment from one mannequin to a different sized mannequin.

**[CONTEXT PRESERVATION]**
Maintain exactly: pose, spatial position, background, facial features, hair, skin tone, any text/logos on clothing or in scene. Professional studio quality.`;
          } else if (bodyType === 'm') {
            promptText = `**[GARMENT PRESERVATION - HIGHEST PRIORITY]**
The clothing MUST remain 100% identical: same style, cut, neckline, hem length, sleeve length, fabric drape, and coverage area. NO alterations to garment design. NO exposed midriff. NO changed proportions of the garment itself. The garment simply scales to medium size.

**CRITICAL DETAIL PRESERVATION:**
Preserve EXACTLY on all garments (especially pants):
- POCKETS: exact placement, size, style, stitching, flaps
- SEAMS: all seam lines in identical positions with same stitching
- HARDWARE: zippers, buttons, rivets, buckles - exact same style and placement
- BELT LOOPS: same number, spacing, and width
- WAISTBAND: identical construction and height
- FABRIC PATTERN: maintain exact patterns, prints, textures, weave
- STITCHING DETAILS: topstitching, decorative stitching must match exactly
- HEMS: same finish, fold, and detail
- Any LOGOS, LABELS, or TEXT on garments must be identical

**[BODY TRANSFORMATION]**
Professional fashion retouching task: Transform model to size M/US 8-10 body type with these precise characteristics:
- Overall frame: Balanced, average proportions, athletic-healthy
- Shoulders: Medium width, approximately 16-17" across, natural rounding
- Bust: Average fullness, natural shape (36-38" circumference)
- Waist: Defined but not extreme, 28-30" circumference
- Hips: Balanced curves, 38-40" circumference, natural hip-to-waist ratio ~1.3
- Arms: Toned, average muscle definition, healthy fullness
- Legs: Strong, athletic, natural thigh shape without gap
- Overall silhouette: Hourglass-to-athletic, natural feminine curves, healthy appearance

The clothing should fit as a perfectly tailored M garment with standard ease - comfortable, professional fit.

**[CRITICAL REMINDER]**
This is a BODY TRANSFORMATION ONLY. The clothing has not been altered, redesigned, or changed in any way - it is simply being worn by a different sized body. Think of this as moving the same exact garment from one mannequin to a different sized mannequin.

**[CONTEXT PRESERVATION]**
Maintain exactly: pose, spatial position, background, facial features, hair, skin tone, any text/logos on clothing or in scene. Professional studio quality.`;
          } else if (bodyType === 'xl') {
            promptText = `**[GARMENT PRESERVATION - ABSOLUTE PRIORITY]**
The clothing MUST remain 100% identical: same style, cut, neckline, hem length, sleeve length, fabric drape, and coverage area. NO alterations to garment design whatsoever. NO exposed midriff. NO wardrobe malfunctions. NO changed necklines or collar shapes. The garment simply scales larger and maintains its professional appearance.

**CRITICAL DETAIL PRESERVATION:**
Preserve EXACTLY on all garments (especially pants):
- POCKETS: exact placement, size, style, stitching, flaps
- SEAMS: all seam lines in identical positions with same stitching
- HARDWARE: zippers, buttons, rivets, buckles - exact same style and placement
- BELT LOOPS: same number, spacing, and width
- WAISTBAND: identical construction and height
- FABRIC PATTERN: maintain exact patterns, prints, textures, weave
- STITCHING DETAILS: topstitching, decorative stitching must match exactly
- HEMS: same finish, fold, and detail
- Any LOGOS, LABELS, or TEXT on garments must be identical

**[BODY TRANSFORMATION]**
Professional fashion retouching task: Transform model to size XL/US 16-18 body type with these precise characteristics:
- Overall frame: Full-figured, voluptuous, proportionally scaled
- Shoulders: Broad, rounded, approximately 18-19" across, soft fullness
- Bust: Full, generous projection (42-44" circumference), natural drape
- Waist: Soft, wide, 34-36" circumference, natural feminine curve
- Hips: Curvy, wide, 44-46" circumference, pronounced hip-to-waist curve ~1.25
- Arms: Full throughout, rounded biceps, soft forearms, proportional hands
- Legs: Thick, strong thighs with natural fullness, defined calves, substantial but proportional
- Overall silhouette: Generously curvy hourglass, voluptuous, clearly plus-size but healthy and proportional

CRITICAL: Model should be substantially larger—visibly XL scale—but maintain realistic, healthy proportions. Not obese, but clearly full-figured with natural fat distribution.

The clothing should fit as a professionally tailored XL garment: structured support, appropriate ease, no pulling or gaping, maintains silhouette.

**[CRITICAL REMINDER]**
This is a BODY TRANSFORMATION ONLY. The clothing has not been altered, redesigned, or changed in any way - it is simply being worn by a different sized body. Think of this as moving the same exact garment from one mannequin to a different sized mannequin.

**[CONTEXT PRESERVATION]**
Maintain exactly: pose, spatial position, background, facial features, hair, skin tone, any text/logos on clothing or in scene. Professional studio quality.`;
          } else {
            promptText = `**[GARMENT PRESERVATION - HIGHEST PRIORITY]**
The clothing MUST remain 100% identical: same style, cut, neckline, hem length, sleeve length, fabric drape, and coverage area. NO alterations to garment design.

**[BODY TRANSFORMATION]**
Professional fashion retouching task: Edit this photo to transform the model's body to a ${bodyType} body type, adjusting her scale to match. The outfit must be rendered in the size appropriate for the new body type.

**[CONTEXT PRESERVATION]**
Maintain exactly: pose, spatial position, background, facial features, hair, skin tone, any text/logos on clothing or in scene.`;
          }

          // Create full Gemini API payload on client side
          const geminiPayload = {
            contents: [{
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            }],
          };

          // Call lightweight proxy endpoint
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-28eb400b/generate-image`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(geminiPayload),
            }
          );

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (e) {
              errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error(`❌ Error generating image ${i + 1}:`, response.status, errorData);
            
            // Mark this specific look as error
            setLooks(prev => prev.map((l, idx) => 
              idx === index ? {
                ...l,
                status: 'error' as const,
                errorMessage: errorData.error || `HTTP ${response.status} error`,
              } : l
            ));
            continue;
          }

          const geminiData = await response.json();
          
          // Extract generated image from Gemini response (client-side processing)
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
            console.error('❌ No image data in Gemini response:', geminiData);
            throw new Error('No image generated by API');
          }

          // Convert base64 to blob URL
          const imageData = generatedImageData.data;
          const imageMimeType = generatedImageData.mimeType || 'image/png';
          const byteCharacters = atob(imageData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: imageMimeType });
          const blobUrl = URL.createObjectURL(blob);

          // Update this specific look
          setLooks(prev => prev.map((l, idx) => 
            idx === index ? {
              ...l,
              generatedImage: blobUrl,
              status: 'completed' as const,
              errorMessage: undefined,
            } : l
          ));

          successCount++;
          console.log(`✅ Successfully generated image ${i + 1}/${pendingLooks.length}`);

          // Add delay between requests (except for the last one)
          if (i < pendingLooks.length - 1) {
            console.log('⏳ Waiting 5 seconds before next image...');
            await delay(5000);
          }

        } catch (error: any) {
          console.error(`❌ Error processing image ${i + 1}:`, error);
          
          // Mark this specific look as error
          setLooks(prev => prev.map((l, idx) => 
            idx === index ? {
              ...l,
              status: 'error' as const,
              errorMessage: error.message || 'An error occurred',
            } : l
          ));
        }
      }

      if (successCount > 0) {
        toast.success("Images Generated!", {
          description: `Successfully generated ${successCount} out of ${pendingLooks.length} look(s).`,
        });
      } else {
        toast.error("Generation Failed", {
          description: "Failed to generate any images. Please try again.",
        });
      }

    } catch (error: any) {
      console.error("Error in generate process:", error);
      toast.error("Generation Failed", {
        description: error.message || 'Please try again.',
      });
      
      // Mark all remaining pending as error
      const pendingIndices = pendingLooks.map(({ index }) => index);
      setLooks(prev => prev.map((l, idx) => 
        pendingIndices.includes(idx) && l.status === 'processing' ? {
          ...l,
          status: 'error' as const,
          errorMessage: error.message || 'An error occurred',
        } : l
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleDeleteLook = (lookId: string) => {
    setLooks(currentLooks => currentLooks.filter(look => look.id !== lookId));
  };

  const handleRegenerateAll = () => {
    // Reset all looks to pending status (clear generated images)
    setLooks(prev => prev.map(look => ({
      ...look,
      status: 'pending' as const,
      generatedImage: undefined,
      errorMessage: undefined,
    })));
    
    toast.success("Ready to Regenerate", {
      description: "Select a new size and click Generate Looks.",
      duration: 3000,
    });
  };

  // Helper function to convert unsupported formats (like AVIF) to JPEG
  const convertFileToJpeg = async (file: File): Promise<File> => {
    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    
    // If already supported, return as-is
    if (supportedMimeTypes.includes(file.type)) {
      return file;
    }

    console.log(`🔄 Converting ${file.type} to JPEG...`);

    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          
          // Convert to JPEG blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'));
              return;
            }

            // Create a new File from the blob
            const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log(`✅ Converted ${file.name} from ${file.type} to image/jpeg`);
            resolve(convertedFile);
          }, 'image/jpeg', 0.95);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRegenerateSingle = async (lookId: string) => {
    if (!accessToken) {
      toast.error("Not Authenticated", {
        description: "Please sign in to generate images.",
        duration: 4000,
      });
      return;
    }

    const lookIndex = looks.findIndex(l => l.id === lookId);
    if (lookIndex === -1) return;

    const look = looks[lookIndex];
    if (!look.file) return;

    setIsGenerating(true);

    // Update status to processing
    setLooks(prev => prev.map((l, idx) => 
      idx === lookIndex ? { ...l, status: 'processing' as const, errorMessage: undefined } : l
    ));

    try {
      // Convert file to JPEG if needed
      const convertedFile = await convertFileToJpeg(look.file);
      const base64Image = await fileToBase64(convertedFile);
      const mimeType = convertedFile.type || 'image/jpeg';

      // Map body type to simple format
      let bodyTypeLabel = '';
      if (bodyType === 'xs') {
        bodyTypeLabel = 'extra small/petite, specifically size XS';
      } else if (bodyType === 'm') {
        bodyTypeLabel = 'medium/average, specifically size M';
      } else if (bodyType === 'xl') {
        bodyTypeLabel = 'plus-size, specifically size extra-large';
      } else {
        bodyTypeLabel = bodyType;
      }

      console.log(`🔁 Regenerating look #${lookIndex + 1} with body type: ${bodyTypeLabel}`);
      
      // --- PROMPT TEXT GENERATION FOR SINGLE REGENERATE ---
      let promptText = '';
          
      if (bodyType === 'xs') {
        promptText = `**[GARMENT PRESERVATION - HIGHEST PRIORITY]**
The clothing MUST remain 100% identical: same style, cut, neckline, hem length, sleeve length, fabric drape, and coverage area. NO alterations to garment design. NO exposed midriff. NO shortened lengths. The garment simply scales proportionally smaller.

**CRITICAL DETAIL PRESERVATION:**
Preserve EXACTLY on all garments (especially pants):
- POCKETS: exact placement, size, style, stitching, flaps
- SEAMS: all seam lines in identical positions with same stitching
- HARDWARE: zippers, buttons, rivets, buckles - exact same style and placement
- BELT LOOPS: same number, spacing, and width
- WAISTBAND: identical construction and height
- FABRIC PATTERN: maintain exact patterns, prints, textures, weave
- STITCHING DETAILS: topstitching, decorative stitching must match exactly
- HEMS: same finish, fold, and detail
- Any LOGOS, LABELS, or TEXT on garments must be identical

**[BODY TRANSFORMATION]**
Professional fashion retouching task: Transform model to size XS/US 0-2 body type with these precise characteristics:
- Overall frame: Petite, delicate bone structure
- Shoulders: Narrow, approximately 14-15" across
- Bust: Small, minimal projection (32-34" circumference)
- Waist: Very defined, 23-25" circumference
- Hips: Narrow, 33-35" circumference, minimal curve
- Arms: Slender throughout, defined wrist bones
- Legs: Lean with visible muscle definition, thigh gap present
- Overall silhouette: Linear, minimal curves, athletic-slim

The clothing should fit as a perfectly tailored XS garment with appropriate ease - not loose, not tight.

**[CRITICAL REMINDER]**
This is a BODY TRANSFORMATION ONLY. The clothing has not been altered, redesigned, or changed in any way - it is simply being worn by a different sized body. Think of this as moving the same exact garment from one mannequin to a different sized mannequin.

**[CONTEXT PRESERVATION]**
Maintain exactly: pose, spatial position, background, facial features, hair, skin tone, any text/logos on clothing or in scene. Professional studio quality.`;
      } else if (bodyType === 'm') {
        promptText = `**[GARMENT PRESERVATION - HIGHEST PRIORITY]**
The clothing MUST remain 100% identical: same style, cut, neckline, hem length, sleeve length, fabric drape, and coverage area. NO alterations to garment design. NO exposed midriff. NO changed proportions of the garment itself. The garment simply scales to medium size.

**CRITICAL DETAIL PRESERVATION:**
Preserve EXACTLY on all garments (especially pants):
- POCKETS: exact placement, size, style, stitching, flaps
- SEAMS: all seam lines in identical positions with same stitching
- HARDWARE: zippers, buttons, rivets, buckles - exact same style and placement
- BELT LOOPS: same number, spacing, and width
- WAISTBAND: identical construction and height
- FABRIC PATTERN: maintain exact patterns, prints, textures, weave
- STITCHING DETAILS: topstitching, decorative stitching must match exactly
- HEMS: same finish, fold, and detail
- Any LOGOS, LABELS, or TEXT on garments must be identical

**[BODY TRANSFORMATION]**
Professional fashion retouching task: Transform model to size M/US 8-10 body type with these precise characteristics:
- Overall frame: Balanced, average proportions, athletic-healthy
- Shoulders: Medium width, approximately 16-17" across, natural rounding
- Bust: Average fullness, natural shape (36-38" circumference)
- Waist: Defined but not extreme, 28-30" circumference
- Hips: Balanced curves, 38-40" circumference, natural hip-to-waist ratio ~1.3
- Arms: Toned, average muscle definition, healthy fullness
- Legs: Strong, athletic, natural thigh shape without gap
- Overall silhouette: Hourglass-to-athletic, natural feminine curves, healthy appearance

The clothing should fit as a perfectly tailored M garment with standard ease - comfortable, professional fit.

**[CRITICAL REMINDER]**
This is a BODY TRANSFORMATION ONLY. The clothing has not been altered, redesigned, or changed in any way - it is simply being worn by a different sized body. Think of this as moving the same exact garment from one mannequin to a different sized mannequin.

**[CONTEXT PRESERVATION]**
Maintain exactly: pose, spatial position, background, facial features, hair, skin tone, any text/logos on clothing or in scene. Professional studio quality.`;
      } else if (bodyType === 'xl') {
        promptText = `**[GARMENT PRESERVATION - ABSOLUTE PRIORITY]**
The clothing MUST remain 100% identical: same style, cut, neckline, hem length, sleeve length, fabric drape, and coverage area. NO alterations to garment design whatsoever. NO exposed midriff. NO wardrobe malfunctions. NO changed necklines or collar shapes. The garment simply scales larger and maintains its professional appearance.

**CRITICAL DETAIL PRESERVATION:**
Preserve EXACTLY on all garments (especially pants):
- POCKETS: exact placement, size, style, stitching, flaps
- SEAMS: all seam lines in identical positions with same stitching
- HARDWARE: zippers, buttons, rivets, buckles - exact same style and placement
- BELT LOOPS: same number, spacing, and width
- WAISTBAND: identical construction and height
- FABRIC PATTERN: maintain exact patterns, prints, textures, weave
- STITCHING DETAILS: topstitching, decorative stitching must match exactly
- HEMS: same finish, fold, and detail
- Any LOGOS, LABELS, or TEXT on garments must be identical

**[BODY TRANSFORMATION]**
Professional fashion retouching task: Transform model to size XL/US 16-18 body type with these precise characteristics:
- Overall frame: Full-figured, voluptuous, proportionally scaled
- Shoulders: Broad, rounded, approximately 18-19" across, soft fullness
- Bust: Full, generous projection (42-44" circumference), natural drape
- Waist: Soft, wide, 34-36" circumference, natural feminine curve
- Hips: Curvy, wide, 44-46" circumference, pronounced hip-to-waist curve ~1.25
- Arms: Full throughout, rounded biceps, soft forearms, proportional hands
- Legs: Thick, strong thighs with natural fullness, defined calves, substantial but proportional
- Overall silhouette: Generously curvy hourglass, voluptuous, clearly plus-size but healthy and proportional

CRITICAL: Model should be substantially larger—visibly XL scale—but maintain realistic, healthy proportions. Not obese, but clearly full-figured with natural fat distribution.

The clothing should fit as a professionally tailored XL garment: structured support, appropriate ease, no pulling or gaping, maintains silhouette.

**[CRITICAL REMINDER]**
This is a BODY TRANSFORMATION ONLY. The clothing has not been altered, redesigned, or changed in any way - it is simply being worn by a different sized body. Think of this as moving the same exact garment from one mannequin to a different sized mannequin.

**[CONTEXT PRESERVATION]**
Maintain exactly: pose, spatial position, background, facial features, hair, skin tone, any text/logos on clothing or in scene. Professional studio quality.`;
      } else {
        promptText = `**[GARMENT PRESERVATION - HIGHEST PRIORITY]**
The clothing MUST remain 100% identical: same style, cut, neckline, hem length, sleeve length, fabric drape, and coverage area. NO alterations to garment design.

**[BODY TRANSFORMATION]**
Professional fashion retouching task: Edit this photo to transform the model's body to a ${bodyType} body type, adjusting her scale to match. The outfit must be rendered in the size appropriate for the new body type.

**[CONTEXT PRESERVATION]**
Maintain exactly: pose, spatial position, background, facial features, hair, skin tone, any text/logos on clothing or in scene.`;
      }

      const geminiPayload = {
        contents: [{
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        }],
      };
      
      // Call lightweight proxy endpoint for single image
      const regenResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28eb400b/generate-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geminiPayload),
        }
      );

      if (!regenResponse.ok) {
        let errorData;
        try {
          errorData = await regenResponse.json();
        } catch (e) {
          errorData = { error: `HTTP ${regenResponse.status}: ${regenResponse.statusText}` };
        }
        console.error('❌ Regeneration error:', regenResponse.status, errorData);
        
        setLooks(prev => prev.map((l, idx) => 
          idx === lookIndex ? {
            ...l,
            status: 'error' as const,
            errorMessage: errorData.error || 'Failed to regenerate image',
          } : l
        ));
        
        toast.error("Regeneration Failed", {
          description: errorData.error || 'Please try again.',
        });
        return;
      }

      const geminiData = await regenResponse.json();
      
      // Extract generated image from Gemini response (client-side processing)
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
        console.error('❌ No image data in Gemini response:', geminiData);
        throw new Error('No image generated by API');
      }

      // Convert base64 to blob URL
      const imageData = generatedImageData.data;
      const imageMimeType = generatedImageData.mimeType || 'image/png';
      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let j = 0; j < byteCharacters.length; j++) {
        byteNumbers[j] = byteCharacters.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: imageMimeType });
      const blobUrl = URL.createObjectURL(blob);

      // Update look with result
      setLooks(prev => prev.map((l, idx) => 
        idx === lookIndex ? {
          ...l,
          generatedImage: blobUrl,
          status: 'completed' as const,
          errorMessage: undefined,
        } : l
      ));

      toast.success("Regenerated Successfully", {
        description: `Look #${lookIndex + 1} has been regenerated.`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error(`Error regenerating image for look ${look.id}:`, error);
      
      setLooks(prev => prev.map((l, idx) => 
        idx === lookIndex ? {
          ...l,
          status: 'error' as const,
          errorMessage: error.message || 'An error occurred while regenerating the image.',
        } : l
      ));
      
      toast.error("Regeneration Failed", {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExpandLook = (look: Look, lookNumber: number) => {
    setExpandedLook(look);
    setExpandedLookNumber(lookNumber);
  };

  const handleDownloadImage = async (imageUrl: string, lookNumber: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `look-${lookNumber}-${bodyType.toUpperCase()}-generated.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: 'linear-gradient(to bottom, #0A0E1A 0%, #111827 100%)',
      }}
    >
      <BackgroundBlobs />

      {/* Main Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <h1 
                className="text-white mb-3"
                style={{
                  fontSize: '3rem',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                LookShift × Nano Bonana
              </h1>
              <p className="text-lg mb-4" style={{ color: '#CBD5E1' }}>
                Upload your looks and preview them on different sizes.
              </p>
              <LayoutToggle layout={layout} onLayoutChange={setLayout} />
            </div>
            
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Layout - Conditional based on layout state */}
        {layout === 'sidebar' ? (
          <div className="grid grid-cols-[32%_1fr] gap-8">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              <UploadCard onFilesUpload={handleFilesUpload} />
              <BodyTypeSelector selected={bodyType} onSelect={setBodyType} />
              <GenerateButton 
                onClick={handleGenerate}
                onRegenerateAll={handleRegenerateAll}
                disabled={looks.length === 0 || isGenerating}
                hasCompletedLooks={hasCompletedLooks}
                hasPendingLooks={hasPendingLooks}
              />
            </div>

            {/* Right Side - Preview Grid */}
            <div 
              className="rounded-3xl p-8 backdrop-blur-xl overflow-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                maxHeight: 'calc(100vh - 280px)',
              }}
            >
              {looks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div 
                    className="p-8 rounded-3xl mb-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px dashed rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <svg 
                      className="w-16 h-16 text-white/20" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
                    </svg>
                  </div>
                  <p className="text-white/40 text-center">
                    Upload your first look to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {looks.map((look, index) => (
                    <PreviewCard
                      key={look.id}
                      lookNumber={index + 1}
                      bodyType={bodyType.toUpperCase()}
                      originalImage={look.originalImage}
                      generatedImage={look.generatedImage}
                      isGenerating={isGenerating}
                      status={look.status}
                      errorMessage={look.errorMessage}
                      onDelete={() => handleDeleteLook(look.id)}
                      onExpand={() => handleExpandLook(look, index + 1)}
                      onDownload={() => look.generatedImage && handleDownloadImage(look.generatedImage, index + 1)}
                      onRegenerate={() => handleRegenerateSingle(look.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Bar - Controls in a row */}
            <div className="grid grid-cols-3 gap-6">
              <UploadCard onFilesUpload={handleFilesUpload} />
              <BodyTypeSelector selected={bodyType} onSelect={setBodyType} />
              <GenerateButton 
                onClick={handleGenerate}
                onRegenerateAll={handleRegenerateAll}
                disabled={looks.length === 0 || isGenerating}
                hasCompletedLooks={hasCompletedLooks}
                hasPendingLooks={hasPendingLooks}
              />
            </div>

            {/* Preview Grid Below */}
            <div 
              className="rounded-3xl p-8 backdrop-blur-xl overflow-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                maxHeight: 'calc(100vh - 380px)',
              }}
            >
              {looks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div 
                    className="p-8 rounded-3xl mb-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px dashed rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <svg 
                      className="w-16 h-16 text-white/20" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
                    </svg>
                  </div>
                  <p className="text-white/40 text-center">
                    Upload your first look to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {looks.map((look, index) => (
                    <PreviewCard
                      key={look.id}
                      lookNumber={index + 1}
                      bodyType={bodyType.toUpperCase()}
                      originalImage={look.originalImage}
                      generatedImage={look.generatedImage}
                      isGenerating={isGenerating}
                      status={look.status}
                      errorMessage={look.errorMessage}
                      onDelete={() => handleDeleteLook(look.id)}
                      onExpand={() => handleExpandLook(look, index + 1)}
                      onDownload={() => look.generatedImage && handleDownloadImage(look.generatedImage, index + 1)}
                      onRegenerate={() => handleRegenerateSingle(look.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-white/30 text-sm mb-1">
            Built as a Nano Bonana demo.
          </p>
          <p className="text-white/20 text-xs">
            © Deborah Imafidon 2025
          </p>
        </footer>
      </div>

      {/* Expanded Look Dialog */}
      {expandedLook && (
        <ExpandedLookDialog
          isOpen={!!expandedLook}
          onClose={() => setExpandedLook(null)}
          lookNumber={expandedLookNumber}
          bodyType={bodyType.toUpperCase()}
          originalImage={expandedLook.originalImage}
          generatedImage={expandedLook.generatedImage}
          onDownload={() => expandedLook.generatedImage && handleDownloadImage(expandedLook.generatedImage, expandedLookNumber)}
        />
      )}
    </div>
  );
}
