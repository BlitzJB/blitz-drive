import { NextRequest, NextResponse } from 'next/server'
import { getFileById } from '@/lib/drive'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await prisma.session.findUnique({
        where: {
            token: request.cookies.get('auth_token')?.value
        }
    })

    if (!session) {
        return new NextResponse('Unauthorized, no session found', { status: 401 })
    }

    const id = params.id
    const [fileId, extension] = id.split('.')

    try {
        const file = await getFileById(fileId)

        if (!file) {
            return new NextResponse('File not found', { status: 404 })
        }

        const response = new NextResponse(file.fileContent.buffer)
        response.headers.set('Content-Type', file.fileContent.mimeType)
        response.headers.set('Content-Disposition', `inline; filename="${file.name}"`)
        return response
    } catch (error) {
        console.error('Error fetching file:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}