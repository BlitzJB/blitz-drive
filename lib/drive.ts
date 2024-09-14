import { DriveSourceFile } from '@/types'
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

export async function getFileById(referenceId: string): Promise<DriveSourceFile | null> {
  try {
    const file = await prisma.fileReference.findFirst({
      where: {
        id: referenceId,
      },
      include: {
        fileContent: true,
      },
    })

    if (!file) {
      return null
    }

    const filePath = path.join(process.cwd(), 'data', 'files', `${file.fileContent.hash}${file.fileContent.extension}`)
    const fileContent = await fs.readFile(filePath)

    return {
        id: file.id,
        name: file.name,
        fileContent: {
            buffer: fileContent,
            mimeType: file.fileContent.mimeType,
        },
    }
  } catch (error) {
    console.error('Error fetching file by ID:', error)
    throw new Error('Failed to fetch file')
  }
}