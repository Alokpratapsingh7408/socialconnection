import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Check if user is admin
async function checkAdminPermission(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { isAdmin: false, user: null }
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return { 
    isAdmin: userProfile?.is_admin || false, 
    user 
  }
}

// Deactivate user (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    const { isAdmin } = await checkAdminPermission(token)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Check if user exists
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, is_active')
      .eq('id', id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Toggle user active status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: !user.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Update user error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      message: `User ${!user.is_active ? 'activated' : 'deactivated'} successfully` 
    })
  } catch (error) {
    console.error('Admin deactivate user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
