import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { 
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server'
import type { 
  AuthenticationResponseJSON,
  AuthenticatorDevice,
  AuthenticatorTransport
} from '@simplewebauthn/typescript-types'
import { AuthenticatorTransportFuture } from '@simplewebauthn/server/script/deps'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const rpName = 'Blitz Drive'
const rpID = 'localhost'
const origin = `http://${rpID}:3000`

// Helper function to generate JWT token
async function generateToken(payload: object): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  
  const encoder = new TextEncoder()
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`)
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, data)
  const encodedSignature = btoa(Array.from(new Uint8Array(signature)).map(byte => String.fromCharCode(byte)).join(''))

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

export async function POST(request: NextRequest) {
  const { username, password, credential } = await request.json()

  const user = await prisma.user.findUnique({ 
    where: { username },
    include: { devices: true }
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let isAuthenticated = false
  let signInMethod = ''

  if (password) {
    isAuthenticated = await compare(password, user.passwordHash)
    signInMethod = 'password'
  } else if (credential) {
    const authenticator = user.devices.find(
      device => device.credentialID === credential.id
    )

    if (!authenticator) {
      return NextResponse.json({ error: 'Authenticator not found' }, { status: 400 })
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response: credential as AuthenticationResponseJSON,
        expectedChallenge: authenticator.challenge || '',
        expectedOrigin: origin,
        expectedRPID: rpID,
        // @ts-ignore
        authenticator: {
          ...authenticator,
          credentialID: Buffer.from(authenticator.credentialID, 'base64'),
          credentialPublicKey: Buffer.from(authenticator.publicKey, 'base64'),
          transports: authenticator.transports.split(',') as AuthenticatorTransportFuture[],
        } as unknown as AuthenticatorDevice,
      })

      isAuthenticated = verification.verified
      signInMethod = 'webauthn'
    } catch (error) {
      console.error(error)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
    }
  }

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Create a session
  const token = await generateToken({ username: user.username, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) })
  const session = await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      signInMethod,
    },
  })

  // Create the response
  const response = NextResponse.json({ success: true })

  // Set the token as an HTTP-only cookie
  response.cookies.set({
    name: 'auth_token',
    value: session.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure in production
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 1 day in seconds
    path: '/',
  })

  return response
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  
  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ 
    where: { username },
    include: { devices: true }
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const options = await generateAuthenticationOptions({
    allowCredentials: user.devices.map(device => ({
      id: device.credentialID,
      type: 'public-key',
      transports: device.transports.split(',') as AuthenticatorTransport[],
    })),
    userVerification: 'preferred',
    rpID,
  })

  // Save the challenge
  await prisma.authenticatorDevice.updateMany({
    where: { userId: user.id },
    data: { challenge: options.challenge },
  })

  return NextResponse.json(options)
}