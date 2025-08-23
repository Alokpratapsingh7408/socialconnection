import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: following, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        created_at,
        following:users!follows_following_id_fkey(
          id, username, avatar_url
        )
      `)
      .eq('follower_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch following' },
        { status: 400 }
      )
    }

    return NextResponse.json({ following })
  } catch (error) {
    console.error('Get following error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
