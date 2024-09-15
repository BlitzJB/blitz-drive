import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, access } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const metadata = JSON.parse(formData.get('metadata') as string)
    const tags = JSON.parse(formData.get('tags') as string)
    const folderPath = formData.get('folderPath') as string || '/'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    const fileExtension = path.extname(file.name)

    // Ensure directories exist
    await mkdir(path.join(process.cwd(), 'data', 'files'), { recursive: true })
    await mkdir(path.join(process.cwd(), 'data', 'previews'), { recursive: true })

    const filePath = path.join(process.cwd(), 'data', 'files', `${hash}${fileExtension}`)
    const previewPath = path.join(process.cwd(), 'data', 'previews', `${hash}.webp`)

    // Check if file content already exists
    let fileContent = await prisma.fileContent.findUnique({ where: { hash } })

    if (!fileContent) {
      // File doesn't exist, save it and generate preview
      await writeFile(filePath, buffer)
      await generatePreview(file, previewPath)

      fileContent = await prisma.fileContent.create({
        data: {
          hash,
          path: filePath,
          size: file.size,
          mimeType: file.type,
          thumbnailUrl: `/api/preview/${hash}`,
          extension: fileExtension,
        },
      })
    } else {
      // File exists, check if physical files are present
      try {
        await access(filePath)
        await access(previewPath)
      } catch (error) {
        // If files are missing, regenerate them
        await writeFile(filePath, buffer)
        await generatePreview(file, previewPath)
      }
    }

    // Create a new file reference
    const fileReference = await prisma.fileReference.create({
      data: {
        name: file.name,
        folderPath,
        userId: session.user.id,
        fileContentId: fileContent.id,
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
        metadata: {
          create: Object.entries(metadata).map(([key, value]) => ({
            key,
            value: String(value),
            type: typeof value,
          })),
        },
      },
      include: {
        fileContent: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      fileReference: {
        ...fileReference,
        fileContent: {
          size: fileReference.fileContent.size,
          mimeType: fileReference.fileContent.mimeType,
          extension: fileReference.fileContent.extension,
        },
      }, 
      isNewUpload: !fileContent 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}

async function generatePreview(file: File, outputPath: string) {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type.startsWith('image/')) {
    await sharp(buffer)
      .resize(200, 200, { fit: 'inside' })
      .webp()
      .toFile(outputPath)
  } else {
    // For non-image files, generate a placeholder preview
    // You can expand this to handle other file types (e.g., PDFs) in the future
    await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 },
      },
    })
      .composite([
        {
          input: {
            text: {
              text: path.extname(file.name).slice(1).toUpperCase(),
              font: 'sans-serif',
              fontSize: 48,
            },
          },
          gravity: 'center',
        },
      ])
      .webp()
      .toFile(outputPath)
  }
}