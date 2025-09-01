# SocialConnect - Social Media Application

🚀 **SocialConnect** is a modern social media web application built with Next.js, TypeScript, Supabase, and Tailwind CSS. It features user authentication, posts, likes, comments, follows, real-time notifications, and an admin panel.

## 🎨 Branding & Assets

### Favicon & Icons
The application features a custom-designed favicon that represents social connection through connected nodes:
- **SVG Favicon**: Modern scalable icon with gradient design
- **PNG Fallbacks**: Multiple sizes (16x16, 32x32, 180x180, 192x192, 512x512)  
- **Safari Support**: Monochrome Safari pinned tab icon
- **Web App Manifest**: PWA-ready configuration
- **Open Graph**: Social media sharing image (1200x630)

### Brand Colors
- **Primary Gradient**: Purple to Pink (#667eea → #764ba2)
- **Theme Color**: #667eea
- **Background**: #ffffff

## 🎯 Features

### Core Functionality
- **Authentication**: Register, login, logout with email verification
- **User Profiles**: Customizable profiles with avatars, bio, website, location
- **Posts**: Create, edit, delete posts with images and categories
- **Social Features**: Like posts, follow/unfollow users
- **Feed**: Personalized feed from followed users
- **Real-time**: Live notifications using Supabase Realtime
- **Admin Panel**: User management and content moderation

### User Roles
- **User**: Standard social media features
- **Admin**: All user features plus moderation capabilities

## 🛠 Technology Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel + Supabase

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

## 🚀 Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd socialconnection
npm install
\`\`\`

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your keys
3. Copy the database schema from \`database-schema.sql\`
4. Run it in the Supabase SQL Editor

### 3. Environment Variables

Create \`.env.local\` file:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

\`\`\`
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── posts/         # Posts CRUD + likes
│   │   ├── users/         # User profiles + follows
│   │   └── ...
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── AuthForm.tsx       # Login/Register form
│   ├── Feed.tsx           # Main feed component
│   ├── PostCard.tsx       # Individual post display
│   └── CreatePostForm.tsx # Create new post
└── lib/
    ├── supabaseClient.ts  # Supabase configuration
    └── utils.ts           # Utility functions
\`\`\`

## 🔧 API Endpoints

### Authentication
- \`POST /api/auth/register\` - User registration
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/logout\` - User logout

### Users
- \`GET /api/users/[id]\` - Get user profile
- \`GET /api/users/me\` - Get current user profile
- \`PATCH /api/users/me\` - Update current user profile

### Posts
- \`POST /api/posts\` - Create new post
- \`GET /api/posts\` - Get posts (paginated)
- \`GET /api/posts/[id]\` - Get specific post
- \`PATCH /api/posts/[id]\` - Update post
- \`DELETE /api/posts/[id]\` - Delete post
- \`POST /api/posts/[id]/like\` - Like post
- \`DELETE /api/posts/[id]/like\` - Unlike post

## 🗄 Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User profiles and settings
- **posts** - User posts with content and metadata
- **likes** - Post likes tracking
- **follows** - User follow relationships
- **comments** - Post comments (coming soon)
- **notifications** - Real-time notifications

Run the complete schema from \`database-schema.sql\` in your Supabase project.

## 🚦 Development

### Install Dependencies
\`\`\`bash
npm install
\`\`\`

### Run Development Server
\`\`\`bash
npm run dev
\`\`\`

### Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

### Lint Code
\`\`\`bash
npm run lint
\`\`\`

## 🌟 Key Features Implementation

### Authentication Flow
1. User registers with email/username/password
2. Supabase sends verification email
3. User profile created in custom users table
4. JWT tokens managed by Supabase Auth

### Post Creation
1. User creates post with content/image/category
2. Image stored in Supabase Storage
3. Post metadata stored in database
4. Real-time updates via Supabase

### Social Features
- **Likes**: Optimistic UI updates for instant feedback
- **Following**: User relationship tracking
- **Feed**: Personalized content from followed users

## 🔐 Security Features

- Row Level Security (RLS) on all tables
- JWT token validation
- Input validation with Zod
- CORS protection
- Rate limiting (production recommended)

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy automatically

### Supabase Configuration
1. Set up RLS policies
2. Configure storage buckets
3. Enable real-time features
4. Set up email templates

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| \`NEXT_PUBLIC_SUPABASE_URL\` | Supabase project URL | ✅ |
| \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` | Supabase anonymous key | ✅ |
| \`SUPABASE_SERVICE_ROLE_KEY\` | Supabase service role key | ✅ |
| \`JWT_SECRET\` | JWT signing secret | ✅ |
| \`NEXT_PUBLIC_APP_URL\` | Application URL | ✅ |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the database schema
- Open an issue on GitHub

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies.**
