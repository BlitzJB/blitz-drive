import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const hash = params.hash
  const previewPath = path.join(process.cwd(), 'data', 'previews', `${hash}.webp`)

  try {
    const fileBuffer = await readFile(previewPath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Preview fetch error:', error)
    return NextResponse.json({ error: 'Preview not found' }, { status: 404 })
  }
}