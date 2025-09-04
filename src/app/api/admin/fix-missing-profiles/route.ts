import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(_request: NextRequest) {
  try {
    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
    }

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        id: string;
        email: string | undefined;
        username?: string;
        status: 'skipped' | 'error' | 'created';
        reason?: string;
      }>
    }

    for (const authUser of authUsers.users) {
      results.processed++
      
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .single()

        if (existingProfile) {
          results.skipped++
          results.details.push({
            id: authUser.id,
            email: authUser.email,
            status: 'skipped',
            reason: 'profile already exists'
          })
          continue
        }

        // Get username from metadata
        const username = authUser.user_metadata?.username
        
        if (!username || !authUser.email) {
          results.errors++
          results.details.push({
            id: authUser.id,
            email: authUser.email,
            status: 'error',
            reason: 'missing username or email in metadata'
          })
          continue
        }

        // Create profile
        const { error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            username,
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            is_private: false,
            is_admin: false,
            is_active: true,
          })

        if (createError) {
          results.errors++
          results.details.push({
            id: authUser.id,
            email: authUser.email,
            status: 'error',
            reason: createError.message
          })
        } else {
          results.created++
          results.details.push({
            id: authUser.id,
            email: authUser.email,
            username,
            status: 'created'
          })
        }
      } catch (userError) {
        results.errors++
        results.details.push({
          id: authUser.id,
          email: authUser.email,
          status: 'error',
          reason: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Profile fix completed',
      results
    })

  } catch (error) {
    console.error('Fix profiles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}