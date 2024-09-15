'use client'

import { useState, useEffect } from 'react'
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MinimizeIcon, MaximizeIcon, XIcon, FileIcon, CheckCircleIcon, ImageIcon, SheetIcon, VideoIcon, ArchiveIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFileUploadContext } from '@/contexts/FileUploadContext'
import { formatFileSize } from '@/lib/utils'

export function FileUploadPopup() {
  const { selectedFiles, uploadProgress, overallProgress, isUploading } = useFileUploadContext()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (isUploading) {
      setIsVisible(true)
      setIsMinimized(false)
    }
  }, [isUploading])

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileIcon className="h-4 w-4 text-red-500" />
      case 'image':
        return <ImageIcon className="h-4 w-4 text-green-500" />
      case 'spreadsheet':
        return <SheetIcon className="h-4 w-4 text-blue-500" />
      case 'presentation':
        return <FileIcon className="h-4 w-4 text-orange-500" />
      case 'video':
        return <VideoIcon className="h-4 w-4 text-purple-500" />
      case 'archive':
        return <ArchiveIcon className="h-4 w-4 text-yellow-500" />
      case 'document':
        return <FileIcon className="h-4 w-4 text-indigo-500" />
      default:
        return <FileIcon className="h-4 w-4" />
    }
  }

  const popupVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { type: 'spring', stiffness: 300, damping: 30 } 
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95, 
      transition: { duration: 0.2 } 
    }
  }

  if (!isVisible || !isUploading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={popupVariants}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className={`w-80 shadow-lg transition-all duration-300 ease-in-out ${isMinimized ? 'h-auto' : 'h-96'}`}>
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">File Upload Progress</h2>
              <div>
                <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)}>
                  {isMinimized ? <MaximizeIcon className="h-4 w-4" /> : <MinimizeIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <AnimatePresence>
              {!isMinimized && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-grow overflow-auto mb-4 pr-2"
                >
                  {selectedFiles.map(file => (
                    <div key={file.name} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center">
                          {getFileIcon(file.type)}
                          <span className="ml-2 truncate">{file.name}</span>
                        </span>
                        <span className="text-xs">{formatFileSize(file.size)}</span>
                      </div>
                      <Progress value={uploadProgress[file.name] || 0} className="h-1 mb-1" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{Math.round(uploadProgress[file.name] || 0)}%</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`${isMinimized ? 'mt-2' : ''}`}>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-1 mb-2" />
              {overallProgress === 100 && (
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Upload complete!
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}