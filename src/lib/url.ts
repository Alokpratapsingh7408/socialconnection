/**
 * Get the site URL for redirects and API calls
 * This function handles both server-side and client-side environments
 */
export function getSiteUrl(): string {
  // Environment variable takes priority
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // On Vercel, use the Vercel URL if available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // On client-side, use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Final fallback to your production domain
  return 'https://socialconnection.vercel.app'
}