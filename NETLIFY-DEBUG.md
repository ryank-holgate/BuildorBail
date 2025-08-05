# Netlify Deployment Debug Guide

## Current Issues and Solutions

### Error: "Cannot read properties of undefined"

This error typically occurs when:
1. The serverless function is not properly handling the request
2. Environment variables are missing
3. The API route path is incorrect

### Steps to Debug:

1. **Check Environment Variables in Netlify Dashboard:**
   - Go to Site Settings → Environment Variables
   - Ensure `GEMINI_API_KEY` is set
   - Ensure `DATABASE_URL` is set (if using database features)

2. **Test the Function Directly:**
   - Visit: `https://your-site.netlify.app/.netlify/functions/test`
   - This should return a JSON response confirming functions work

3. **Check API Route:**
   - The frontend makes POST requests to `/api/analyze`
   - This should redirect to `/.netlify/functions/api/analyze`
   - Check Network tab in browser dev tools

4. **View Function Logs:**
   - Go to Netlify Dashboard → Functions → View logs
   - Look for console.log output and error messages

## Simplified Function Structure

The current Netlify function:
- Removes database dependencies to avoid serverless issues
- Uses only @google/genai and zod for validation
- Returns mock analytics data
- Includes detailed error logging

## Alternative Deployment Options

If Netlify continues to have issues:

1. **Vercel**: Similar serverless platform with better Node.js support
2. **Railway**: Full-stack deployment with persistent database
3. **Render**: Full-stack with automatic database connections
4. **Keep Replit**: The app works perfectly on Replit

## Quick Fix Commands

If you need to update the function:
```bash
# Test the function structure
cd netlify/functions
node -e "const api = require('./api.js'); console.log('Function loaded successfully');"

# Deploy to Netlify
git add .
git commit -m "Update serverless function"
git push
```

## Testing the Function

1. **Test Function Existence**: Visit `https://your-site.netlify.app/.netlify/functions/test`
2. **Test API Function**: Visit `https://your-site.netlify.app/.netlify/functions/api` (should return 404 with debug info)
3. **Check Logs**: Go to Netlify Dashboard → Functions → View logs to see console output

## Environment Variable Format

Ensure these are set in Netlify:
- `GEMINI_API_KEY`: Your Google AI API key (starts with AI...)
- `DATABASE_URL`: PostgreSQL connection string (if needed)