import { NextResponse } from 'next/server'
import { getBinItems } from '@/lib/drive'

export async function GET() {
  try {
    const items = await getBinItems()
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching bin items:', error)
    return NextResponse.json({ error: 'Failed to fetch bin items' }, { status: 500 })
  }
}