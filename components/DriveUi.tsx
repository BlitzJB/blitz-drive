'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileUploadProvider } from '@/contexts/FileUploadContext'
import { FileItem } from '@/types'
import DriveUiContent from './DriveUiContent'
import toast from 'react-hot-toast'

interface DriveUiProps {
  initialPath?: string[]
}

export function DriveUi({ initialPath = [] }: DriveUiProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(initialPath)
  const [items, setItems] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/drive/contents?path=${currentPath.join('/')}`)
      if (!response.ok) {
        throw new Error('Failed to fetch items')
      }
      const data = await response.json()
      const newItems: FileItem[] = [
        ...data.folders.map((folder: any) => ({
          type: 'folder',
          name: folder.name,
          id: folder.path,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        ...data.files.map((file: any) => ({
          type: 'file',
          name: file.name,
          id: file.id,
          size: file.fileContent.size,
          fileType: file.fileContent.mimeType,
          thumbnailUrl: file.fileContent.thumbnailUrl,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt),
        })),
      ]
      setItems(newItems)
    } catch (error) {
      console.error('Error fetching items:', error)
      // toast.error("There was an error fetching the items. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [currentPath])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return (
    <FileUploadProvider items={items} setItems={setItems}>
      <DriveUiContent
        currentPath={currentPath} 
        setCurrentPath={setCurrentPath} 
        items={items}
        isLoading={isLoading}
        fetchItems={fetchItems}
      />
    </FileUploadProvider>
  )
}