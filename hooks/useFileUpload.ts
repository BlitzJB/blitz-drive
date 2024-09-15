import { useState, useRef, useCallback } from 'react'
import { FileItem } from '@/types'
import toast from 'react-hot-toast'

export function useFileUpload(items: FileItem[], setItems: React.Dispatch<React.SetStateAction<FileItem[]>>) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [overallProgress, setOverallProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files))
      setIsUploadModalOpen(true)
    }
  }, [])

  const updateOverallProgress = useCallback((progress: { [key: string]: number }) => {
    const totalProgress = Object.values(progress).reduce((sum, value) => sum + value, 0)
    const averageProgress = totalProgress / Object.keys(progress).length
    setOverallProgress(averageProgress)
  }, [])

  const handleUpload = useCallback(async (formDataArray: FormData[]) => {
    setIsUploading(true)
    const totalFiles = formDataArray.length
    let newUploadProgress = {}

    try {
      const uploadPromises = formDataArray.map(async (formData, index) => {
        const file = formData.get('file') as File | null
        if (!file) return

        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload', true)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            newUploadProgress = { ...newUploadProgress, [file.name]: progress }
            setUploadProgress(newUploadProgress)
            updateOverallProgress(newUploadProgress)
          }
        }

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText))
            } else {
              reject(new Error(`Upload failed for ${file.name}`))
            }
          }
          xhr.onerror = () => reject(new Error(`Network error during upload of ${file.name}`))
        })

        xhr.send(formData)
        const result = await uploadPromise as any

        if (result.success && result.fileReference) {
          setItems(prevItems => [...prevItems, {
            type: 'file',
            name: result.fileReference.name,
            size: result.fileReference.fileContent?.size || 0,
            fileType: result.fileReference.fileContent?.mimeType || 'application/octet-stream',
            // Add other properties as needed
          }])
        } else {
          throw new Error('Invalid response from server')
        }
        
        return result
      })

      await Promise.all(uploadPromises)
      // Removed the overall success toast as well
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Some files failed to upload. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress({})
      setOverallProgress(0)
    }
  }, [setItems, updateOverallProgress])

  return {
    isUploadModalOpen,
    setIsUploadModalOpen,
    handleFileSelect,
    handleUpload,
    fileInputRef,
    selectedFiles,
    uploadProgress,
    overallProgress,
    isUploading,
  }
}