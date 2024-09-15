import { DriveSourceFile, FileItem } from '@/types'
import { FileReference, PrismaClient } from '@prisma/client'
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

export async function getContents(path: string, options: { excludeBin?: boolean } = {}) {
  const fileReferences = await prisma.fileReference.findMany({
    where: {
      folderPath: path,
      ...(options.excludeBin ? { 
        OR: [
          { isBin: false }
        ]
      } : {}),
    },
    include: {
      fileContent: true,
    },
  })

  const folders = await prisma.folder.findMany({
    where: {
      path: path,
    },
  })

  return {
    folders,
    files: fileReferences,
  }
}

export async function updateFileReference(id: string, data: Partial<FileReference>) {
  return prisma.fileReference.update({
    where: { id },
    data,
  })
}

export async function getBinItems(): Promise<FileItem[]> {
  try {
    const binItems = await prisma.fileReference.findMany({
      where: {
        isBin: true,
        binExpireDate: {
          gt: new Date(), // Only fetch items that haven't expired
        },
      },
      include: {
        fileContent: true,
        folder: true,
      },
    })

    return binItems.map(item => ({
      id: item.id,
      name: item.name,
      type: item.folder ? 'folder' : 'file',
      size: item.fileContent?.size || 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      fileType: item.fileContent?.mimeType,
      thumbnailUrl: item.fileContent?.thumbnailUrl || undefined,
      isBin: item.isBin,
      binExpireDate: item.binExpireDate,
      folderPath: item.folderPath,
    }))
  } catch (error) {
    console.error('Error fetching bin items:', error)
    throw new Error('Failed to fetch bin items')
  }
}

export async function restoreItem(id: string): Promise<void> {
  try {
    await prisma.fileReference.update({
      where: { id },
      data: {
        isBin: false,
        binExpireDate: null,
      },
    })
  } catch (error) {
    console.error('Error restoring item:', error)
    throw new Error('Failed to restore item')
  }
}

export async function getFileReferences(fileId: string): Promise<string[]> {
  try {
    const fileReference = await prisma.fileReference.findUnique({
      where: { id: fileId },
      include: { fileContent: true },
    })

    if (!fileReference) {
      return []
    }

    const references = await prisma.fileReference.findMany({
      where: {
        fileContentId: fileReference.fileContentId,
        id: { not: fileId }, // Exclude the current file
      },
      select: { id: true },
    })

    return references.map(ref => ref.id)
  } catch (error) {
    console.error('Error getting file references:', error)
    throw new Error('Failed to get file references')
  }
}

export async function deleteFileFromFilesystem(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.error('Error deleting file from filesystem:', error)
    throw new Error('Failed to delete file from filesystem')
  }
}

export async function permanentlyDeleteItem(id: string): Promise<{ previewPath?: string; filePath?: string }> {
  try {
    const fileReference = await prisma.fileReference.findUnique({
      where: { id },
      include: { fileContent: true },
    })

    if (!fileReference) {
      throw new Error('File reference not found')
    }

    // Delete the file reference
    await prisma.fileReference.delete({
      where: { id },
    })

    // Check if there are any other references to the same file content
    const otherReferences = await prisma.fileReference.findFirst({
      where: { fileContentId: fileReference.fileContentId },
    })

    let filePath: string | undefined

    // If no other references exist, delete the file content and the actual file
    if (!otherReferences) {
      await prisma.fileContent.delete({
        where: { id: fileReference.fileContentId },
      })

      filePath = path.join(process.cwd(), 'data', 'files', `${fileReference.fileContent.hash}${fileReference.fileContent.extension}`)
    }

    return {
      previewPath: fileReference.fileContent.thumbnailUrl || undefined,
      filePath,
    }
  } catch (error) {
    console.error('Error permanently deleting item:', error)
    throw new Error('Failed to permanently delete item')
  }
}

export async function moveItemToBin(id: string): Promise<void> {
  try {
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    await prisma.fileReference.update({
      where: { id },
      data: {
        isBin: true,
        binExpireDate: oneYearFromNow,
      },
    })
  } catch (error) {
    console.error('Error moving item to bin:', error)
    throw new Error('Failed to move item to bin')
  }
}
