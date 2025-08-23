import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
})

// Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Comments fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 400 }
      )
    }

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the authorization token from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify the user with the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if post exists
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = createCommentSchema.parse(body)

    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: id,
        content,
      })
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .single()

    if (commentError) {
      console.error('Comment creation error:', commentError)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Comment created successfully',
      comment,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
