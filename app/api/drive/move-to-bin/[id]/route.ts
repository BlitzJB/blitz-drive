import { NextResponse } from 'next/server'
import { moveItemToBin } from '@/lib/drive'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    await moveItemToBin(id)
    return NextResponse.json({ message: 'Item moved to bin successfully' })
  } catch (error) {
    console.error('Error moving item to bin:', error)
    return NextResponse.json({ error: 'Failed to move item to bin' }, { status: 500 })
  }
}