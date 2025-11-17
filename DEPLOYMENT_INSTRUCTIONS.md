# Deployment Instructions

## Updates Applied

### 1. Fixed API Response Parsing Bug
Changed `inline_data` to `inlineData` to match Gemini's camelCase response format.

### 2. Improved Prompts for Better Body Transformation
The prompts are now much more explicit and descriptive to ensure visible body transformations.

**BEFORE (too vague):**
```typescript
const prompt = `Keep everything in the photo the same, but make the model ${bodyType} body type.`;
```

**AFTER (explicit and detailed):**
```typescript
// For XL/Plus-size:
prompt = `Transform this fashion model image: Keep the outfit, pose, lighting, and background exactly the same, but change the model's body to be plus-size and curvy (size XL/XXL) with fuller proportions, rounder face, thicker arms and legs, and a larger overall body frame. Make her noticeably larger and curvier.`;

// For XS/Petite:
prompt = `Transform this fashion model image: Keep the outfit, pose, lighting, and background exactly the same, but change the model's body to be petite and extra small (size XS) with a very slim, delicate frame. Make her noticeably thinner with smaller proportions.`;

// For S/Slim:
prompt = `Transform this fashion model image: Keep the outfit, pose, lighting, and background exactly the same, but change the model's body to be slim and small (size S) with a lean, slender frame.`;
```

## How to Deploy the Fix

### Method 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Click on **Edge Functions** in the left sidebar
3. Find and click on the `make-server-28eb400b` function
4. Click **Edit Function** 
5. Select all the code in the editor (Cmd+A / Ctrl+A)
6. Open the file: `src/supabase/functions/server/index.tsx` in your editor
7. Copy ALL the contents (Cmd+C / Ctrl+C)
8. Paste it into the Supabase dashboard editor (Cmd+V / Ctrl+V)
9. Click **Deploy** or **Save & Deploy**
10. Wait for deployment to complete (should take ~30 seconds)

### Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# From the project root directory
cd /Users/esosaimafidon/Downloads/LookShift

# Deploy the function
supabase functions deploy make-server-28eb400b
```

## Testing the Fix

1. After deploying, go to your app: http://localhost:3000
2. Sign in to your account
3. Upload an image
4. Select a body type (XS, S, or XL)
5. Click "Generate Looks"
6. The generation should now work without the "No image returned from Gemini" error

## What This Fix Does

The Gemini API returns responses with camelCase property names (`inlineData`) but the code was using snake_case (`inline_data`). This mismatch caused the server to not find the generated image in the response, even though Gemini was successfully generating it.

The fix ensures the code correctly reads the `inlineData` property from Gemini's response.
