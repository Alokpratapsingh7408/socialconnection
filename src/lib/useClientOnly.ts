import { useState, useEffect } from 'react'

/**
 * Hook to prevent hydration errors by ensuring client-side only rendering
 * for components that depend on browser APIs or dynamic state
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}