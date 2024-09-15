import { NextRequest, NextResponse } from 'next/server'
import { getFileById } from '@/lib/drive'
import { PrismaClient } from '@prisma/client'
import { updateFileReference } from '@/lib/drive'

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

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const oneYearFromNow = new Date()
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

        await updateFileReference(id, {
            isBin: true,
            binExpireDate: oneYearFromNow,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }
}