import { NextRequest, NextResponse } from 'next/server'
import { getContents } from '@/lib/drive'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path') || '/'

    try {
        const contents = await getContents(path, { excludeBin: true })
        return NextResponse.json(contents)
    } catch (error) {
        console.error('Error fetching contents:', error)
        return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 })
    }
}