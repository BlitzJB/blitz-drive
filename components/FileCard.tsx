import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpLeft, FileIcon, FolderIcon, MoreVertical, Trash2 } from 'lucide-react'
import { FileItem, ViewType } from '@/types'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FileCardProps {
  item: FileItem
  items: FileItem[]
  view: ViewType
  navigateToFolder: (folderName: string) => void
  previewUrl: string
  onDelete: (item: FileItem) => void
  onRestore: (item: FileItem) => void
  isBin?: boolean
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export function FileCard({
  item,
  items,
  view,
  navigateToFolder,
  previewUrl,
  onDelete,
  onRestore,
  isBin = false
}: FileCardProps) {
  const isFolder = item.type === 'folder'
  const isImage = item.fileType?.startsWith('image/')

  const renderMoreOptions = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {isBin ? (
          <DropdownMenuItem onClick={() => onRestore(item)}>
            <ArrowUpLeft className="mr-2 h-4 w-4 text-green-500" />
            <span className="text-green-500">Restore</span>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => onDelete(item)}>
          <Trash2 className={`mr-2 h-4 w-4 ${isBin ? 'text-red-500' : 'text-muted-foreground'}`} />
          <span className={isBin ? 'text-red-500' : 'text-muted-foreground'}>
            {isBin ? 'Delete Permanently' : item.type === 'folder' ? 'Delete Folder' : 'Move to Bin'}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

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
            {renderMoreOptions()}
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
        {renderMoreOptions()}
      </div>
    </motion.div>
  )
}