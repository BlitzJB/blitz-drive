export interface FileItem {
    id: string
    type: 'file' | 'folder'
    folderPath: string
    name: string
    items?: FileItem[]
    size?: number
    fileType?: string
    thumbnailUrl?: string
    createdAt: Date
    updatedAt: Date
}

export interface MetadataItem {
    key: string;
    value: string;
    type: 'text' | 'date' | 'number';
}

export type ViewType = 'grid' | 'list' | 'gallery'

export interface DriveSourceFile {
    id: string
    name: string
    fileContent: {
        buffer: Buffer
        mimeType: string
    }
}

export interface FileReference {
    // ... existing properties ...
    isBin: boolean
    binExpireDate: Date | null
}