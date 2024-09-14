import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NextImage from 'next/image'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from 'lucide-react'
import { cn } from "@/lib/utils"
import { FileItem } from '@/types'

interface GalleryViewProps {
  isOpen: boolean
  onClose: () => void
  items: FileItem[]
  initialIndex: number
  onIndexChange: (index: number) => void
}

export function GalleryView({ isOpen, onClose, items, initialIndex, onIndexChange }: GalleryViewProps) {
  const [galleryIndex, setGalleryIndex] = useState(initialIndex)
  const [direction, setDirection] = useState(0)
  const [isFileNameVisible, setIsFileNameVisible] = useState(true)
  const [mouseIdleTimer, setMouseIdleTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setGalleryIndex(initialIndex)
  }, [initialIndex])

  const navigateGallery = useCallback((newDirection: 'prev' | 'next') => {
    setDirection(newDirection === 'next' ? 1 : -1)
    const newIndex = newDirection === 'prev' ? galleryIndex - 1 : galleryIndex + 1
    const updatedIndex = (newIndex + items.length) % items.length
    setGalleryIndex(updatedIndex)
    onIndexChange(updatedIndex)
  }, [galleryIndex, items.length, onIndexChange])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      navigateGallery('prev')
    } else if (e.key === 'ArrowRight') {
      navigateGallery('next')
    } else if (e.key === ' ') {
      setIsFileNameVisible(false)
    }
  }, [navigateGallery])

  const handleMouseMove = useCallback(() => {
    setIsFileNameVisible(true)
    if (mouseIdleTimer) {
      clearTimeout(mouseIdleTimer)
    }
    const timer = setTimeout(() => setIsFileNameVisible(false), 3000)
    setMouseIdleTimer(timer)
  }, [mouseIdleTimer])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer)
      }
    }
  }, [handleKeyDown, handleMouseMove, mouseIdleTimer])

  const variants = {
    enter: (direction: number) => ({
      scale: 0.2,
      x: direction > 0 ? '40vw' : '-40vw',
      opacity: 0,
    }),
    center: {
      scale: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      scale: 0.2,
      x: direction < 0 ? '40vw' : '-40vw',
      opacity: 0,
    }),
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      onClose()
      onIndexChange(galleryIndex)
    }}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] p-0 bg-black border-none">
        {items.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white z-10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="relative md:w-[90vw] w-[100vw] h-[100vh] flex items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={galleryIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="absolute md:h-full h-[80vh] w-[100vw] flex items-center justify-center"
                >
                  <NextImage
                    src={`/api/drive/file/${items[galleryIndex].id}`}
                    alt={items[galleryIndex].name}
                    className="max-w-full max-h-full object-contain"
                    width={1920}
                    height={1080}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: isFileNameVisible ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "absolute top-4 left-4",
                "text-white bg-black bg-opacity-50 p-2 rounded"
              )}
            >
              {items[galleryIndex].name}
            </motion.div>
            {galleryIndex > 0 && (
              <div 
                className="absolute left-0 md:top-1/2 bottom-0 transform md:-translate-y-1/2 w-20 md:h-32 h-20 opacity-50 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigateGallery('prev')}
              >
                <NextImage
                  src={`/api/drive/file/${items[(galleryIndex - 1 + items.length) % items.length].id}`}
                  alt={items[(galleryIndex - 1 + items.length) % items.length].name}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            )}
            {galleryIndex < items.length - 1 && (
              <div 
                className="absolute right-0 md:top-1/2 bottom-0 transform md:-translate-y-1/2 w-20 md:h-32 h-20 opacity-50 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigateGallery('next')}
              >
                <NextImage
                  src={`/api/drive/file/${items[(galleryIndex + 1) % items.length].id}`}
                  alt={items[(galleryIndex + 1) % items.length].name}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-white">
            No images available in the gallery.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}