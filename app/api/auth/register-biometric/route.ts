import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { 
  generateRegistrationOptions,
  verifyRegistrationResponse
} from '@simplewebauthn/server'
import type { 
  RegistrationResponseJSON,
  AuthenticatorDevice
} from '@simplewebauthn/typescript-types'
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers'

const prisma = new PrismaClient()

const rpName = 'Blitz Drive'
const rpID = 'localhost'
const origin = `http://${rpID}:3000`

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the token and get the user
  // This is a placeholder. You should implement proper token verification.
  const user = await prisma.user.findFirst({ where: { sessions: { some: { token } } } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: isoBase64URL.toBuffer(user.id),
    userName: user.username,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'preferred',
      authenticatorAttachment: 'platform',
    },
  })

  // Save the challenge in the database
  await prisma.user.update({
    where: { id: user.id },
    data: { currentChallenge: options.challenge },
  })

  return NextResponse.json(options)
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findFirst({ 
    where: { sessions: { some: { token } } },
    include: { devices: true }
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { deviceName, credential } = await request.json()

  try {
    const verification = await verifyRegistrationResponse({
      response: credential as RegistrationResponseJSON,
      expectedChallenge: user.currentChallenge || '',
      expectedOrigin: origin,
      expectedRPID: rpID,
    })

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

      const existingDevice = user.devices.find(
        device => device.credentialID === isoBase64URL.fromBuffer(Buffer.from(credentialID))
      )

      if (existingDevice) {
        return NextResponse.json({ error: 'Device already registered' }, { status: 400 })
      }

      const newDevice = await prisma.authenticatorDevice.create({
        data: {
          credentialID: isoBase64URL.fromBuffer(Buffer.from(credentialID)),
          publicKey: isoBase64URL.fromBuffer(Buffer.from(credentialPublicKey)),
          counter,
          transports: (credential as RegistrationResponseJSON).response.transports?.join(',') || '',
          userId: user.id,
          name: deviceName,
        },
      })

      // Clear the challenge after successful registration
      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: null },
      })

      return NextResponse.json({ success: true, device: newDevice })
    }
  } catch (error) {
    console.error('Biometric registration error:', error)
    return NextResponse.json({ error: 'Biometric registration failed', details: (error as Error).message }, { status: 400 })
  }

  return NextResponse.json({ error: 'Biometric registration failed' }, { status: 400 })
}