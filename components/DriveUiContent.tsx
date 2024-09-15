'use client'

import { useState, } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid, List, Image, Upload, Plus, Trash2, Search } from 'lucide-react'
import { FileCard } from './FileCard'
import { UploadModal } from './UploadModal'
import { BreadcrumbNav } from './BreadcrumbNav'
import { useFileUploadContext } from '@/contexts/FileUploadContext'
import { FileItem, ViewType } from '@/types'
import { Toaster } from 'react-hot-toast'
import { CreateFolderModal } from './CreateFolderModal'
import { motion, AnimatePresence } from 'framer-motion'
import NextImage from 'next/image'
import path from 'path'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GalleryView } from './GalleryView'
import toast from 'react-hot-toast'

interface DriveUiContentProps {
  currentPath: string[]
  setCurrentPath: (path: string[]) => void
  items: FileItem[]
  isLoading: boolean
  fetchItems: () => Promise<void>
  isBin?: boolean
  onRestore?: (itemId: string) => Promise<void>
  onDelete?: (itemId: string) => Promise<void>
}

export default function DriveUiContent({
  currentPath,
  setCurrentPath,
  items,
  isLoading,
  fetchItems,
  isBin = false,
  onRestore,
  onDelete
}: DriveUiContentProps) {
  const [view, setView] = useState<ViewType>('grid')
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null)
  const router = useRouter()

  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    handleFileSelect,
    handleUpload,
    fileInputRef,
  } = useFileUploadContext()

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

  const handleRestoreClick = async (item: FileItem) => {
    if (onRestore) {
      try {
        await onRestore(item.id)
        toast.success('Item restored successfully')
        await fetchItems()
      } catch (error) {
        console.error('Error restoring item:', error)
        toast.error('Failed to restore item')
      }
    }
  }

  const handleDeleteClick = (item: FileItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      if (isBin && onDelete) {
        await onDelete(itemToDelete.id)
        toast.success('Item permanently deleted')
      } else {
        // Move to bin logic
        const response = await fetch(`/api/drive/move-to-bin/${itemToDelete.id}`, {
          method: 'POST',
        })
        if (!response.ok) {
          throw new Error('Failed to move item to bin')
        }
        toast.success('Item moved to bin')
      }
      await fetchItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error(isBin ? 'Failed to delete item' : 'Failed to move item to bin')
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const navigateToBin = () => {
    router.push('/bin')
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{isBin ? 'Bin' : 'Blitz Drive'}</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input type="search" placeholder={`Search ${isBin ? 'bin' : 'files'}...`} className="w-64 pl-8" />
          </div>
          {isBin ? (
            <Button variant="outline" onClick={() => router.push('/drive')}>
              Back to Drive
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={navigateToBin}>
                <Trash2 className="mr-2 h-4 w-4" /> Bin
              </Button>
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
            </>
          )}
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
          {!isBin && (
            <Button variant="secondary" onClick={() => setIsCreateFolderModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Folder
            </Button>
          )}
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
                  onDelete={handleDeleteClick}
                  onRestore={isBin ? handleRestoreClick : undefined}
                  isBin={isBin}
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
                  onDelete={handleDeleteClick}
                  onRestore={isBin ? handleRestoreClick : undefined}
                  isBin={isBin}
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
        fetchItems={fetchItems}
      />

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBin ? 'Permanently Delete' : 'Move to Bin'}</DialogTitle>
            <DialogDescription>
              {isBin
                ? `Are you sure you want to permanently delete "${itemToDelete?.name}"? This action cannot be undone.`
                : `Are you sure you want to move "${itemToDelete?.name}" to the bin? You can restore it later from the bin before ${new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365).toLocaleDateString()}.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
            >
              {isBin ? 'Permanently Delete' : 'Move to Bin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}