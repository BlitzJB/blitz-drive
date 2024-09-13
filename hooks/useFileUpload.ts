import { useState, useRef, useCallback } from 'react'
import { FileItem } from '@/types'
import toast from 'react-hot-toast'

export function useFileUpload(items: FileItem[], setItems: React.Dispatch<React.SetStateAction<FileItem[]>>) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files))
      setIsUploadModalOpen(true)
    }
  }, [])

  const handleUpload = useCallback(async (formData: FormData) => {
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      if (result.success && result.fileReference) {
        // Add the new file to the items list
        setItems(prevItems => [...prevItems, {
          type: 'file',
          name: result.fileReference.name,
          size: result.fileReference.fileContent?.size || 0,
          fileType: result.fileReference.fileContent?.mimeType || 'application/octet-stream',
          // Add other properties as needed
        }])

        if (result.isNewUpload) {
          toast.success(`File ${result.fileReference.name} uploaded successfully`)
        } else {
          toast.success(`File ${result.fileReference.name} already exists and has been added to your drive`)
        }
      } else {
        throw new Error('Invalid response from server')
      }
      
      return result
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
      throw error
    }
  }, [setItems])

  return {
    isUploadModalOpen,
    setIsUploadModalOpen,
    handleFileSelect,
    handleUpload,
    fileInputRef,
    selectedFiles,
  }
}