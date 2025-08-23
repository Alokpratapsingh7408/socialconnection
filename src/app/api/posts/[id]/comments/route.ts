import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
})

// Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .eq('post_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 400 }
      )
    }

    return NextResponse.json({ comments })
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
  { params }: { params: { id: string } }
) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if post exists
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = createCommentSchema.parse(body)

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: params.id,
        content,
      })
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .single()

    if (commentError) {
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
