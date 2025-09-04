# Production Environment Variables

For proper email verification redirects in production, make sure these environment variables are set in your Vercel deployment:

## Required Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fvvqdmkdzbifxaaoyhdk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Site URL for redirects (IMPORTANT FOR EMAIL VERIFICATION)
NEXT_PUBLIC_SITE_URL=https://socialconnection.vercel.app
```

## Vercel Deployment Steps:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the `NEXT_PUBLIC_SITE_URL` variable if it's missing
5. Redeploy your application

## Supabase Settings:

Make sure your Supabase Auth settings have:
- Site URL: `https://socialconnection.vercel.app`
- Redirect URLs: `https://socialconnection.vercel.app/**`

This ensures email verification links will redirect to your production domain instead of localhost.