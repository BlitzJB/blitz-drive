'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileUploadProvider } from '@/contexts/FileUploadContext'
import { FileItem } from '@/types'
import DriveUiContent from './DriveUiContent'
// import toast from 'react-hot-toast'

interface BinUiProps {
  initialPath?: string[]
}

export function BinUi({ initialPath = [] }: BinUiProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(initialPath)
  const [items, setItems] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchBinItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/drive/bin')
      if (!response.ok) {
        throw new Error('Failed to fetch bin items')
      }
      const data = await response.json()
      const binItems: FileItem[] = data.items.map((item: any) => ({
        ...item,
        isBin: true,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))
      setItems(binItems)
    } catch (error) {
      console.error('Error fetching bin items:', error)
    //   toast.error("There was an error fetching the bin items. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBinItems()
  }, [fetchBinItems])

  const handleRestore = async (itemId: string) => {
    try {
      const response = await fetch(`/api/drive/bin/restore/${itemId}`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to restore item')
      }
    //   toast.success('Item restored successfully')
      await fetchBinItems() // Refresh the bin items
    } catch (error) {
      console.error('Error restoring item:', error)
    //   toast.error('Failed to restore item')
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/drive/bin/${itemId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete item')
      }
    //   toast.success('Item deleted permanently')
      await fetchBinItems() // Refresh the bin items
    } catch (error) {
      console.error('Error deleting item:', error)
    //   toast.error('Failed to delete item')
    }
  }

  return (
    <FileUploadProvider items={items} setItems={setItems}>
      <DriveUiContent
        currentPath={currentPath}
        setCurrentPath={setCurrentPath}
        items={items}
        isLoading={isLoading}
        fetchItems={fetchBinItems}
        isBin={true}
        onRestore={handleRestore}
        onDelete={handleDelete}
      />
    </FileUploadProvider>
  )
}