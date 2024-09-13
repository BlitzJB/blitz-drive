import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const hash = params.hash

  try {
    const fileContent = await prisma.fileContent.findUnique({ where: { hash } })
    if (!fileContent) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const filePath = path.join(process.cwd(), 'data', 'files', `${hash}${fileContent.extension}`)
    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileContent.mimeType,
        'Content-Disposition': `inline; filename="${fileContent.references[0]?.name || `file${fileContent.extension}`}"`,
      },
    })
  } catch (error) {
    console.error('File fetch error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}