import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('auth_token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized, no session token' }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Unauthorized, session expired' }, { status: 401 })
    }

    const { name, path } = await req.json()

    const newFolder = await prisma.folder.create({
      data: {
        name,
        path: path || '/',
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true, folder: newFolder })
  } catch (error) {
    console.error('Folder creation error:', error)
    return NextResponse.json({ success: false, error: 'Folder creation failed' }, { status: 500 })
  }
}