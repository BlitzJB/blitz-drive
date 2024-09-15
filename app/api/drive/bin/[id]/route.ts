import { NextResponse } from 'next/server'
import { permanentlyDeleteItem, getFileReferences, deleteFileFromFilesystem } from '@/lib/drive'
import { deletePreview } from '@/lib/preview'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const fileReferences = await getFileReferences(id)

    if (fileReferences.length === 0) {
      const fileInfo = await permanentlyDeleteItem(id)
      
      if (fileInfo.previewPath) {
        await deletePreview(fileInfo.previewPath)
      }

      if (fileInfo.filePath) {
        await deleteFileFromFilesystem(fileInfo.filePath)
      }

      return NextResponse.json({ message: 'Item and associated files deleted permanently' })
    } else {
      await permanentlyDeleteItem(id)
      return NextResponse.json({ message: 'Item deleted from database, but files retained due to existing references' })
    }
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}