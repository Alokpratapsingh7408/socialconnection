'use client'

import { AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AlertBarProps {
  message: string | null
  error: string | null
  onDismiss: () => void
}

export function AlertBar({ message, error, onDismiss }: AlertBarProps) {
  if (!message && !error) return null

  return (
    <div className={`w-full p-3 text-center text-sm font-medium ${
      message ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center justify-center space-x-2">
        {message ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span>{message || error}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-white hover:bg-white/20 p-1 h-auto"
        >
          ×
        </Button>
      </div>
    </div>
  )
}
