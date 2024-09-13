export interface FileItem {
    id: string
    type: 'file' | 'folder'
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