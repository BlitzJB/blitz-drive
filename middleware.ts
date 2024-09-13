import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyToken(token: string): Promise<boolean> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    const signatureUint8 = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    
    const encoder = new TextEncoder()
    const data = encoder.encode(`${headerB64}.${payloadB64}`)
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    return await crypto.subtle.verify('HMAC', key, signatureUint8, data)
  } catch (error) {
    console.error('Token verification failed:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  const isValid = await verifyToken(token)
  
  if (isValid) {
    return NextResponse.next()
  } else {
    console.log('Token verification failed')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: ['/drive/:path*'],
}