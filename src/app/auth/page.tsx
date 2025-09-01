'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AuthForm } from '@/components/AuthForm'
import { CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type AuthStep = 'login' | 'register' | 'verify-email' | 'check-email'

export default function AuthPage() {
  const [authStep, setAuthStep] = useState<AuthStep>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  const handleAuth = async (formData: { email: string; password: string; username?: string }) => {
    setIsLoading(true)
    setAuthError(null)
    setAuthMessage(null)
    setUserEmail(formData.email)
    
    try {
      if (authStep === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const data = await response.json()
          setAuthMessage(data.message)
          setAuthStep('login')
        } else {
          const errorData = await response.json()
          setAuthError(errorData.error || 'Registration failed')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setAuthStep('check-email')
            setAuthMessage('Please check your email and click the verification link to verify your account.')
          } else {
            setAuthError(error.message)
          }
        } else if (data.session) {
          setAuthMessage('Welcome back! Signed in successfully.')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError('An unexpected error occurred. Please try again.')
    }
    setIsLoading(false)
  }

  const handleResendVerification = async () => {
    if (!userEmail) return
    
    setIsLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: userEmail,
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Verification email sent! Please check your inbox.')
    }
    setIsLoading(false)
  }

  // Email verification page
  if (authStep === 'check-email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription className="text-purple-100">
              We sent a verification link to <strong>{userEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. Check your email inbox (and spam folder)</p>
              <p>2. Click the verification link</p>
              <p>3. You&apos;ll be automatically signed in</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleResendVerification} 
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              
              <Button 
                onClick={() => {
                  setAuthStep('login')
                  setAuthMessage(null)
                  setAuthError(null)
                }}
                variant="ghost"
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>

            {authMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{authMessage}</span>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{authError}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            SocialConnect
          </h1>
          <p className="text-gray-600 text-lg">Connect with friends and share your thoughts</p>
        </div>
        
        <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6">
            <div className="flex justify-center items-center space-x-4">
              <Button
                onClick={() => {
                  setAuthStep('login')
                  setAuthError(null)
                  setAuthMessage(null)
                }}
                variant={authStep === 'login' ? 'secondary' : 'ghost'}
                size="lg"
                className={`flex-1 max-w-[120px] font-medium ${
                  authStep === 'login' 
                    ? 'bg-white text-purple-600 hover:bg-gray-100' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  setAuthStep('register')
                  setAuthError(null)
                  setAuthMessage(null)
                }}
                variant={authStep === 'register' ? 'secondary' : 'ghost'}
                size="lg"
                className={`flex-1 max-w-[120px] font-medium ${
                  authStep === 'register' 
                    ? 'bg-white text-purple-600 hover:bg-gray-100' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Sign Up
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AuthForm 
              mode={authStep === 'register' ? 'register' : 'login'} 
              onSubmit={handleAuth} 
              isLoading={isLoading} 
            />

            {authMessage && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{authMessage}</span>
              </div>
            )}

            {authError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{authError}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/'
            }}
            className="text-sm bg-white/80 border-purple-200 hover:bg-purple-50 hover:border-purple-300 rounded-full px-6 py-2"
          >
            Continue as Guest
          </Button>
        </div>
      </div>
    </div>
  )
}
