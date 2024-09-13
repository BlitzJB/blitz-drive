import React, { createContext, useContext, ReactNode } from 'react'
import { useFileUpload } from '@/hooks/useFileUpload'
import { FileItem } from '@/types'

interface FileUploadContextType {
  isUploadModalOpen: boolean
  setIsUploadModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleUpload: (formData: FormData) => Promise<any>
  fileInputRef: React.RefObject<HTMLInputElement>
  selectedFiles: File[]
}

const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined)

export function FileUploadProvider({ children, items, setItems }: { children: ReactNode, items: FileItem[], setItems: React.Dispatch<React.SetStateAction<FileItem[]>> }) {
  const fileUploadProps = useFileUpload(items, setItems)

  return (
    <FileUploadContext.Provider value={fileUploadProps}>
      {children}
    </FileUploadContext.Provider>
  )
}

export function useFileUploadContext() {
  const context = useContext(FileUploadContext)
  if (context === undefined) {
    throw new Error('useFileUploadContext must be used within a FileUploadProvider')
  }
  return context
}