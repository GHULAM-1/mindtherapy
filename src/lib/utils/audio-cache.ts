/**
 * Audio Caching Utility
 * Implements content-addressable storage for audio files using SHA-256 hashing
 */

/**
 * Calculate SHA-256 hash of text for content-addressable storage
 * Same text always produces the same hash, enabling deduplication
 */
export async function calculateAudioHash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Build Supabase Storage URL for audio file
 * @param hash - SHA-256 hash of the text
 * @param bucketName - Supabase Storage bucket name
 * @returns Full URL to the audio file
 */
export function getAudioUrl(hash: string, bucketName: string = 'audio'): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${hash}.mp3`
}

/**
 * Check if audio file exists in Supabase Storage
 * Uses HEAD request to avoid downloading the file
 * @param url - Full URL to the audio file
 * @returns true if file exists (HTTP 200), false otherwise
 */
export async function checkAudioExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error('Error checking audio existence:', error)
    return false
  }
}
