import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileIcon, FolderIcon, MoreVertical } from 'lucide-react'
import { FileItem, ViewType } from '@/types'
import { motion } from 'framer-motion'

interface FileCardProps {
  item: FileItem
  items: FileItem[]
  view: ViewType
  navigateToFolder: (folderName: string) => void
  previewUrl: string
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export function FileCard({ item, items, view, navigateToFolder, previewUrl }: FileCardProps) {
  const isFolder = item.type === 'folder'
  const isImage = item.fileType?.startsWith('image/')

  if (view === 'grid') {
    return (
      <motion.div
        layout
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
            <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            {isFolder ? (
              <div className="w-full h-32 flex items-center justify-center bg-muted cursor-pointer" onClick={() => navigateToFolder(item.name)}>
                <FolderIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            ) : isImage ? (
              <img src={previewUrl} alt={item.name} className="w-full h-32 object-contain" />
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-muted">
                <FileIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            {isFolder ? `${items.length} items` : `${item.size} bytes`}
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center space-x-4 py-2">
        {isFolder ? (
          <div className="cursor-pointer" onClick={() => navigateToFolder(item.name)}>
            <FolderIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        ) : isImage ? (
          <img src={previewUrl} alt={item.name} className="w-10 h-10 object-contain" />
        ) : (
          <FileIcon className="h-10 w-10 text-muted-foreground" />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-medium">{item.name}</h3>
          <p className="text-xs text-muted-foreground">
            {isFolder ? `${items.length} items` : `${item.size} bytes`}
          </p>
        </div>
        <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
      </div>
    </motion.div>
  )
}