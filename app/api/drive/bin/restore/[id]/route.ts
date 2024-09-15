import { NextResponse } from 'next/server'
import { restoreItem } from '@/lib/drive'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    await restoreItem(id)
    return NextResponse.json({ message: 'Item restored successfully' })
  } catch (error) {
    console.error('Error restoring item:', error)
    return NextResponse.json({ error: 'Failed to restore item' }, { status: 500 })
  }
}