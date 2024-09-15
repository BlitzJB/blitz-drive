import fs from 'fs/promises'
import path from 'path'

export async function deletePreview(previewPath: string): Promise<void> {
    const fileHash = previewPath.split('/').pop()
    if (!fileHash) {
        throw new Error('Invalid preview path')
    }
    try {
        const fullPath = path.join(process.cwd(), 'data', 'previews', fileHash)
        await fs.unlink(fullPath)
    } catch (error) {
        console.error('Error deleting preview file:', error)
        // throw new Error('Failed to delete preview file')
    }
}