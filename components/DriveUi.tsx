'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid, List, Image, Upload, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { FileCard } from './FileCard'
import { UploadModal } from './UploadModal'
import { BreadcrumbNav } from './BreadcrumbNav'
import { FileUploadProvider, useFileUploadContext } from '@/contexts/FileUploadContext'
import { FileItem, ViewType } from '@/types'
import { Toaster } from 'react-hot-toast'
import { CreateFolderModal } from './CreateFolderModal'
import { motion, AnimatePresence } from 'framer-motion'
import NextImage from 'next/image'
import path from 'path'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { GalleryView } from './GalleryView'

function DriveUiContent({ currentPath, setCurrentPath }: { currentPath: string[], setCurrentPath: (path: string[]) => void }) {
  const [view, setView] = useState<ViewType>('grid')
  const [items, setItems] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const router = useRouter()

  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    handleFileSelect,
    handleUpload,
    fileInputRef,
  } = useFileUploadContext()

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
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false)
    }
  }, [currentPath])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const navigateToFolder = (folderName: string) => {
    const newPath = [...currentPath, folderName]
    setCurrentPath(newPath)
    router.push(`/drive/${newPath.join('/')}`)
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      const response = await fetch('/api/drive/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          path: currentPath.join('/'),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create folder')
      }

      await fetchItems()
      setIsCreateFolderModalOpen(false)
    } catch (error) {
      console.error('Error creating folder:', error)
      // Handle error (e.g., show error message to user)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const openLightbox = (index: number) => {
    setGalleryIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  const galleryItems = items.filter(item => item.type === 'file' && item.fileType?.startsWith('image/'))

  const getFileExtension = (fileName: string): string => {
    return path.extname(fileName).toLowerCase()
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Blitz Drive</h1>
        <div className="flex items-center space-x-2">
          <Input type="search" placeholder="Search files..." className="w-64" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      <BreadcrumbNav currentPath={currentPath} setCurrentPath={setCurrentPath} />

      <Tabs defaultValue="grid" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="grid" onClick={() => setView('grid')}><Grid className="mr-2 h-4 w-4" /> Grid</TabsTrigger>
            <TabsTrigger value="list" onClick={() => setView('list')}><List className="mr-2 h-4 w-4" /> List</TabsTrigger>
            <TabsTrigger value="gallery"><Image className="mr-2 h-4 w-4" /> Gallery</TabsTrigger>
          </TabsList>
          <Button variant="secondary" onClick={() => setIsCreateFolderModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Folder
          </Button>
        </div>
        <TabsContent value="grid">
          <AnimatePresence>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {!isLoading && items.map((item) => (
                <FileCard 
                  key={item.id} 
                  item={item} 
                  items={items} 
                  view="grid" 
                  navigateToFolder={navigateToFolder} 
                  previewUrl={item.thumbnailUrl || ''} 
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
        <TabsContent value="list">
          <AnimatePresence>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {!isLoading && items.map((item) => (
                <FileCard 
                  key={item.id} 
                  item={item} 
                  items={items} 
                  view="list" 
                  navigateToFolder={navigateToFolder} 
                  previewUrl={item.thumbnailUrl || ''} 
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
        <TabsContent value="gallery">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {!isLoading && galleryItems.map((item, index) => (
              <div
                key={item.id}
                className="cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <NextImage
                  src={item.thumbnailUrl || '/placeholder-image.jpg'}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="object-cover w-full h-48"
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <GalleryView
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        items={galleryItems}
        initialIndex={galleryIndex}
        onIndexChange={setGalleryIndex}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentPath={currentPath}
      />

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  )
}

interface DriveUiProps {
  initialPath?: string[]
}

export function DriveUi({ initialPath = [] }: DriveUiProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(initialPath)
  const [items, setItems] = useState<FileItem[]>([])

  return (
    <FileUploadProvider items={items} setItems={setItems}>
      <DriveUiContent currentPath={currentPath} setCurrentPath={setCurrentPath} />
    </FileUploadProvider>
  )
}