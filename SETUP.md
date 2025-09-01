# SocialConnect Setup Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account and project

## Environment Setup

1. **Copy the environment template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the following values:
     - Project URL
     - Anon key (public)
     - Service role key (secret)

3. **Update `.env.local` with your credentials:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## Database Setup

1. **Run the database schema:**
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `database-schema.sql`
   - Run the script

2. **Enable Row Level Security:**
   The schema includes RLS policies that will be automatically applied.

3. **Enable Realtime (optional):**
   - Go to Database > Replication
   - Enable realtime for the `notifications` table

## Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Features Included

✅ **Authentication System**
- User registration with email verification
- Login/logout functionality
- JWT-based authentication

✅ **Social Media Features**
- Create, edit, delete posts
- Like/unlike posts
- Comment system
- Follow/unfollow users
- Personalized feed

✅ **User Profiles**
- Profile management
- Avatar uploads
- User statistics (followers, following, posts)

✅ **Real-time Notifications**
- Follow notifications
- Like notifications
- Comment notifications

✅ **Admin Panel**
- User management
- Content moderation
- Platform statistics

✅ **Responsive UI**
- Modern design with Tailwind CSS
- shadcn/ui components
- Mobile-friendly interface

## Admin Setup

To make a user an admin:

1. **Update user in database:**
   ```sql
   UPDATE users 
   SET is_admin = true 
   WHERE email = 'your-admin-email@example.com';
   ```

2. **Admin Features:**
   - User management (deactivate users)
   - Content moderation (delete posts)
   - Platform statistics dashboard

## Deployment

### Vercel Deployment

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically

3. **Environment Variables for Production:**
   Add the same variables from `.env.local` to your Vercel project settings.

## Troubleshooting

### Common Issues

1. **"Invalid URL" error:**
   - Check that your Supabase URL is correct in `.env.local`
   - Make sure the URL starts with `https://`

2. **Authentication not working:**
   - Verify your Supabase anon key is correct
   - Check that email confirmation is set up in Supabase Auth settings

3. **Database errors:**
   - Ensure the database schema has been applied
   - Check that RLS policies are enabled

4. **Build errors:**
   - Run `npm run build` to check for TypeScript errors
   - Most issues are related to missing environment variables

### Support

For issues and questions:
- Check the Supabase documentation
- Review the Next.js documentation
- Check the console for detailed error messages

## License

This project is for educational purposes. Feel free to modify and use as needed.
