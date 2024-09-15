'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Type, Hash } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { MultiSelectWithChips } from './multi-select-with-chips'
import { MetadataItem } from '@/types'
import { useFileUploadContext } from '@/contexts/FileUploadContext'
import toast from 'react-hot-toast'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  currentPath: string[]
  fetchItems: () => Promise<void>
}

export function UploadModal({ isOpen, onClose, currentPath, fetchItems }: UploadModalProps) {
  const { selectedFiles, handleUpload } = useFileUploadContext()
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [fileName, setFileName] = useState('')
  const [selectedTags, setSelectedTags] = useState<{ value: string; label: string }[]>([])
  const [metadata, setMetadata] = useState<MetadataItem[]>([])
  const [allTags] = useState([
    { value: 'important', label: 'Important' },
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
  ])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (selectedFiles.length > 0) {
      setFileName(selectedFiles[currentFileIndex].name)
    }
  }, [selectedFiles, currentFileIndex])

  const addMetadata = (type: 'text' | 'date' | 'number') => {
    setMetadata([...metadata, { key: '', value: '', type }])
  }

  const handleTagSelect = (newTags: { value: string; label: string }[]) => {
    setSelectedTags(newTags)
  }

  const handleFileUpload = async () => {
    setIsUploading(true)
    try {
      const formDataArray = selectedFiles.map((file, index) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('metadata', JSON.stringify(metadata))
        formData.append('tags', JSON.stringify(selectedTags.map(tag => tag.value)))
        formData.append('folderPath', currentPath.join('/'))
        return formData
      })

      await handleUpload(formDataArray)

      onClose()
      toast.success("All files have been uploaded successfully.")
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("There was an error uploading the files. Please try again.")
    } finally {
      setIsUploading(false)
      await fetchItems()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[856px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Add details for your files. Use the arrows to navigate between files.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
              disabled={currentFileIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{currentFileIndex + 1} of {selectedFiles.length}</span>
            <Button 
              onClick={() => setCurrentFileIndex(prev => Math.min(selectedFiles.length - 1, prev + 1))}
              disabled={currentFileIndex === selectedFiles.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <Label htmlFor="fileName">File Name</Label>
            <Input 
              id="fileName" 
              value={fileName} 
              onChange={(e) => setFileName(e.target.value)} 
            />
          </div>
          <div>
            <Label>Tags</Label>
            <div className="flex space-x-2">
              <MultiSelectWithChips
                options={allTags}
                selectedOptions={selectedTags}
                onChange={handleTagSelect}
                placeholder="Select tags..."
              />
              <Button onClick={() => {/* Apply to all logic */}} className='text-nowrap text-white'>Apply to All</Button>
            </div>
          </div>
          <div>
            <Label>Metadata</Label>
            {metadata.map((item, index) => (
              <div key={index} className="flex space-x-2 mt-2">
                <Input 
                  placeholder="Key" 
                  value={item.key} 
                  onChange={(e) => {
                    const newMetadata = [...metadata]
                    newMetadata[index] = { ...newMetadata[index], key: e.target.value }
                    setMetadata(newMetadata)
                  }} 
                />
                {item.type === 'date' ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        {item.value ? format(new Date(item.value), "PPP") : "Pick"}
                        <CalendarIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={item.value ? new Date(item.value) : undefined}
                        onSelect={(date) => {
                          const newMetadata = [...metadata]
                          newMetadata[index] = { ...newMetadata[index], value: date ? date.toISOString() : '' }
                          setMetadata(newMetadata)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input 
                    placeholder="Value" 
                    value={item.value} 
                    type={item.type === 'number' ? 'number' : 'text'}
                    onChange={(e) => {
                      const newMetadata = [...metadata]
                      newMetadata[index] = { ...newMetadata[index], value: e.target.value }
                      setMetadata(newMetadata)
                    }} 
                  />
                )}
                <Button onClick={() => {/* Apply to all logic */}} className='text-nowrap text-white'>Apply to All</Button>
              </div>
            ))}
            <div className="flex space-x-2 mt-2">
              <Button onClick={() => addMetadata('text')}><Type className="mr-2 h-4 w-4" />Text</Button>
              <Button onClick={() => addMetadata('date')}><CalendarIcon className="mr-2 h-4 w-4" />Date</Button>
              <Button onClick={() => addMetadata('number')}><Hash className="mr-2 h-4 w-4" />Number</Button>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleFileUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}