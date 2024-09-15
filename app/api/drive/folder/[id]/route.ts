import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    // Check if the folder exists
    const folder = await prisma.folder.findUnique({
      where: { id }
    })

    const childFolders = await prisma.folder.findMany({
      where: {
        path: (folder?.path  === "/" ? "" : folder?.path) + "/" + folder?.name
      },
    })

    const files = await prisma.fileReference.findMany({
      where: {
        folderPath: (folder?.path  === "/" ? "" : folder?.path) + "/" + folder?.name,
        isBin: false
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if the folder is empty
    if (files.length > 0 || childFolders.length > 0) {
      return NextResponse.json({ error: 'Folder is not empty' }, { status: 400 })
    }

    // Delete the folder
    await prisma.folder.delete({ where: { id } })

    return NextResponse.json({ message: 'Folder deleted successfully' })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}