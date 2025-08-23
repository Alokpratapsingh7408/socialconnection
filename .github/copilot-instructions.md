# SocialConnect Project Instructions

🚀 **SocialConnect** - A social media web application backend + frontend using Next.js (with API routes) and Supabase.

## 🎯 Project Goal
Build SocialConnect, a social media web application backend + frontend using Next.js (with API routes) and Supabase (PostgreSQL + Storage + Realtime).
The app must support users posting content, following each other, liking/commenting, viewing personalized feeds, and receiving real-time notifications.
Admins should be able to manage users and moderate content.

## 🛠 Technology Stack
- **Framework**: Next.js (API + Frontend in one project) with TypeScript
- **Database**: PostgreSQL via Supabase
- **Authentication**: JWT-based auth (Supabase Auth or custom JWT logic if needed)
- **Storage**: Supabase Storage (for images/avatars)
- **UI**: React + Next.js + Tailwind CSS + shadcn/ui
- **Realtime**: Supabase Realtime (for notifications)
- **Deployment**: Vercel (frontend/backend) + Supabase (DB/Storage/Auth)

## 👤 Roles & Permissions
- **User (default)** → Can register/login, create profile, post, like, comment, follow/unfollow, view feeds.
- **Admin** → Has all user privileges plus user management and content moderation (deactivate users, delete posts, view stats).

## 🔑 Core Features
1. **Authentication** - JWT-based login, register, logout, refresh token, email verification, password reset
2. **Profiles** - CRUD for own profile with username, bio, avatar, website, location, follower counts
3. **Posts** - CRUD for posts with content (≤280 chars), images, categories, like/comment counts
4. **Follows** - Follow/unfollow users, list followers & following
5. **Likes & Comments** - Like/unlike posts, flat comment system
6. **Feed** - Personalized feed from followed users, paginated
7. **Notifications** - Real-time notifications via Supabase Realtime
8. **Admin Panel** - User management, content moderation, statistics

## 📂 Project Structure
```
/socialconnect
  /lib
    supabaseClient.ts
  /pages
    /api
      auth/        → register, login, logout, refresh, password management
      users/       → profile CRUD, follow/unfollow
      posts/       → posts CRUD, like, comment
      feed.ts      → personalized feed
      notifications.ts → fetch/mark notifications
      admin/       → user + post management
    index.tsx      → Feed UI
    auth.tsx       → Auth pages
    profile.tsx    → Profile UI
    post.tsx       → Post detail
  /components
    AuthForm.tsx
    Feed.tsx
    PostCard.tsx
    ProfileCard.tsx
    Notifications.tsx
```

## Development Guidelines
- Always follow Next.js API route structure with TypeScript
- Use Supabase client for all DB, auth, and storage actions
- Enforce role-based permissions in APIs (User vs Admin)
- Validate input (e.g., usernames, post length, image type/size)
- Use Tailwind + shadcn/ui for frontend UI components
- Keep endpoints consistent with REST-style naming
- Write clean, modular code (separate concerns: API, UI, DB)

## Progress Checklist
- [x] Create copilot-instructions.md file
- [x] Scaffold Next.js project with TypeScript
- [x] Set up Supabase integration
- [x] Create database schema
- [x] Implement authentication system
- [x] Build user profiles and posts
- [x] Add social features (likes, basic feed)
- [x] Create basic UI components with Tailwind and shadcn/ui
- [x] Implement full social features (follows, comments)
- [x] Implement feed and notifications
- [x] Create admin panel
- [x] Create user profile pages
- [x] Create notifications page
- [x] Add navigation and routing
- [ ] Test and deploy

## Current Status
✅ **All core functionality is complete**:
- Authentication (register, login, logout)
- User profiles with CRUD operations
- Posts creation, editing, deletion
- Like/unlike functionality
- Follow/unfollow system
- Comments system
- Personalized feed with pagination
- Real-time notifications system
- Complete admin panel with user management and statistics
- User profile pages with posts and follow functionality
- Notifications page with real-time updates
- Responsive UI with shadcn/ui components
- Navigation between all pages
- Complete API endpoints for all features

🎉 **Project Status: FEATURE COMPLETE**

All major features from the requirements have been implemented:
1. ✅ Authentication system with email verification
2. ✅ User profiles with avatar, bio, and social stats
3. ✅ Complete posts system (CRUD, images, categories)
4. ✅ Social features (likes, comments, follows)
5. ✅ Personalized feed algorithm
6. ✅ Real-time notifications system
7. ✅ Admin panel with user/content management
8. ✅ Responsive modern UI design
9. ✅ Complete navigation and routing

## Next Steps
1. Configure Supabase environment variables
2. Run database schema in Supabase
3. Test all features locally
4. Deploy to Vercel
