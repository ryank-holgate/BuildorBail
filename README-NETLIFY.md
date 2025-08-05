# BuildOrBail - Netlify Deployment Guide

## Prerequisites

1. **Environment Variables**: Set these in your Netlify dashboard under Site Settings → Environment Variables:
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
   - `GEMINI_API_KEY` - Your Google Gemini API key

## Deployment Steps

1. **Connect Repository**: 
   - Push your code to GitHub
   - Connect the repository to Netlify

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Functions directory: `netlify/functions`

3. **Environment Variables**:
   - Add `DATABASE_URL` and `GEMINI_API_KEY` in Netlify dashboard
   - These are automatically available to serverless functions

## How It Works

- **Frontend**: React app built with Vite, served as static files
- **Backend**: Express API routes converted to Netlify serverless functions
- **Database**: PostgreSQL via Neon (simplified for serverless deployment)
- **AI**: Google Gemini API for app idea analysis

## Important Notes

The Netlify version is simplified compared to the full Express version:
- Database operations are simplified for serverless environment
- Rate limiting is basic (you may want to implement Redis-based rate limiting)
- Analytics data is mock data (implement database queries for production)
- Session management is removed (stateless serverless functions)

## API Routes

All API routes are handled by the serverless function at `/.netlify/functions/api`:

- `POST /api/analyze` - Analyze app ideas
- `GET /api/results` - Get all validation results  
- `GET /api/analytics` - Get analytics data
- `GET /api/wall-of-shame` - Get BAIL verdicts

## Local Development

For local development, continue using:
```bash
npm run dev
```

This runs the Express server locally. The Netlify functions are only used in production.

## Troubleshooting

1. **Function Timeouts**: Netlify functions have a 10-second timeout. The Gemini API analysis should complete within this limit.

2. **Cold Starts**: First requests may be slower due to serverless cold starts.

3. **Database Connection**: Ensure your DATABASE_URL is correctly formatted for Neon's serverless driver.

4. **CORS Issues**: The `_headers` file handles CORS for the serverless functions.

## Performance Optimizations

- Database connections are pooled
- Static assets are served via Netlify's CDN
- API responses are optimized for size
- Rate limiting prevents abuse