import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabaseClient'

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

    // Check if username already exists using admin client
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

    // Use standard signup flow which sends verification email automatically
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    })

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.user && !data.session) {
      // User created but email not verified yet
      return NextResponse.json({
        message: 'Registration successful! Please check your email to verify your account before signing in.',
        user: data.user,
        needsVerification: true
      })
    } else if (data.session && data.user) {
      // User created and automatically signed in (email confirmation disabled in Supabase)
      // Create user profile in our users table
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          username,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          is_private: false,
          is_admin: false,
          is_active: true,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Registration successful! You are now signed in.',
        user: data.user,
        session: data.session,
        needsVerification: false
      })
    }

    return NextResponse.json({
      message: 'Registration initiated. Please check your email.',
      needsVerification: true
    })

  } catch (error) {
    console.error('Registration error:', error)

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
