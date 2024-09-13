import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET(request: NextRequest) {
    const prisma = new PrismaClient()

    const auth_token = request.cookies.get('auth_token')
    if (!auth_token) {
        return NextResponse.json({ error: 'Unauthorized, no auth token found' }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
        where: {
            token: auth_token.value,
        },
    })
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized, no session found' }, { status: 401 })
    }

    const folderPath = request.nextUrl.searchParams.get('path') || '/'

    const files = await prisma.fileReference.findMany({
        where: {
            userId: session.userId,
            folderPath: folderPath,
        },
        select: {
            id: true,
            name: true,
            folderPath: true,
            createdAt: true,
            updatedAt: true,
            fileContent: {
                select: {
                    size: true,
                    mimeType: true,
                    thumbnailUrl: true,
                },
            },
        },
    })

    const folders = await prisma.folder.findMany({
        where: {
            userId: session.userId,
            path: folderPath,
        },
        select: {
            id: true,
            name: true,
            path: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    console.log(folders, folderPath)

    return NextResponse.json({ folders, files })
}