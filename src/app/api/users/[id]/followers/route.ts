import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: followers, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        created_at,
        follower:users!follows_follower_id_fkey(
          id, username, avatar_url
        )
      `)
      .eq('following_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch followers' },
        { status: 400 }
      )
    }

    return NextResponse.json({ followers })
  } catch (error) {
    console.error('Get followers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
