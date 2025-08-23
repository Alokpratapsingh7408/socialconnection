import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabaseAdmin'

// Simple validation without zod to avoid version issues
function validatePostData(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format')
  }
  
  const postData = data as Record<string, unknown>
  
  if (!postData.content || typeof postData.content !== 'string') {
    throw new Error('Content is required and must be a string')
  }
  if (postData.content.length < 1 || postData.content.length > 280) {
    throw new Error('Content must be between 1 and 280 characters')
  }
  
  // Validate image URL if provided
  if (postData.image_url) {
    if (typeof postData.image_url !== 'string') {
      throw new Error('Image URL must be a string')
    }
    // Basic URL validation
    if (postData.image_url.trim() && !isValidUrl(postData.image_url)) {
      throw new Error('Image URL must be a valid URL')
    }
  }
  
  if (postData.category && !['general', 'announcement', 'question'].includes(postData.category as string)) {
    throw new Error('Category must be general, announcement, or question')
  }
  
  return {
    content: postData.content,
    image_url: postData.image_url && typeof postData.image_url === 'string' && postData.image_url.trim() ? postData.image_url.trim() : null,
    category: (postData.category as string) || 'general'
  }
}

// Helper function to validate URL
function isValidUrl(string: string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

// Create a new post
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('Auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const validatedData = validatePostData(body)
    console.log('Validated data:', validatedData)

    // Check if user profile exists in our users table
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('id', user.id)
      .single()

    if (userError || !userProfile) {
      console.log('User profile not found, creating one...')
      // Create user profile if it doesn't exist
      const { error: createUserError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          is_private: false,
          is_admin: false,
          is_active: true,
        })

      if (createUserError) {
        console.error('Failed to create user profile:', createUserError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
    }

    // Use admin client to bypass RLS for server-side operations
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: user.id,
        content: validatedData.content,
        image_url: validatedData.image_url,
        category: validatedData.category,
        like_count: 0,
        comment_count: 0,
      })
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .single()

    if (postError) {
      console.error('Database error:', postError)
      return NextResponse.json(
        { error: 'Failed to create post', details: postError.message },
        { status: 400 }
      )
    }

    console.log('Post created successfully:', post)
    return NextResponse.json({
      message: 'Post created successfully',
      post,
    })
  } catch (error) {
    console.error('Create post error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get posts with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    // Use admin client to bypass RLS for reading posts
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get posts error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ posts, page, limit })
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
