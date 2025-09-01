import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Simple validation function
function validateRegisterData(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format')
  }
  
  const regData = data as Record<string, unknown>
  
  if (!regData.email || typeof regData.email !== 'string') {
    throw new Error('Email is required')
  }
  if (!regData.password || typeof regData.password !== 'string' || regData.password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }
  if (!regData.username || typeof regData.username !== 'string' || regData.username.length < 3) {
    throw new Error('Username must be at least 3 characters')
  }
  if (!/^[a-zA-Z0-9_]+$/.test(regData.username)) {
    throw new Error('Username can only contain letters, numbers, and underscores')
  }
  if (!regData.adminKey || regData.adminKey !== 'SOCIALCONNECT_ADMIN_2024') {
    throw new Error('Invalid admin registration key')
  }
  
  return {
    email: regData.email,
    password: regData.password,
    username: regData.username
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username } = validateRegisterData(body)

    console.log('Creating admin user:', username, email)

    // Check if username already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Create user with Supabase Auth using admin client
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        username,
        is_admin: true,
      },
      email_confirm: true, // Auto-confirm email
    })

    if (error) {
      console.error('Admin auth user creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create admin profile in users table
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          username,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          is_private: false,
          is_admin: true, // ✅ Set as admin
          is_active: true,
          bio: 'SocialConnect Administrator',
        })

      if (profileError) {
        console.error('Admin profile creation error:', profileError)
        
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(data.user.id)
        
        return NextResponse.json(
          { error: 'Failed to create admin profile' },
          { status: 500 }
        )
      }
    }

    console.log('Admin user created successfully:', username)

    return NextResponse.json({
      message: 'Admin registration successful! You can now sign in as an admin.',
      user: data.user,
    })
  } catch (error) {
    console.error('Admin registration error:', error)
    
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
