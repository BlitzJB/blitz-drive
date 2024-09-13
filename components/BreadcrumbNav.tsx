import { Button } from "@/components/ui/button"
import { ChevronRight, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BreadcrumbNavProps {
  currentPath: string[]
  setCurrentPath: (path: string[]) => void
}

export function BreadcrumbNav({ currentPath, setCurrentPath }: BreadcrumbNavProps) {
  const router = useRouter()

  const navigateToBreadcrumb = (index: number) => {
    const newPath = currentPath.slice(0, index + 1)
    setCurrentPath(newPath)
    router.push(`/drive/${newPath.join('/')}`)
  }

  const navigateToHome = () => {
    setCurrentPath([])
    router.push('/drive')
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 mb-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={navigateToHome}
        className="flex items-center"
      >
        <Home className="h-4 w-4 mr-1" />
        Home
      </Button>
      {currentPath.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      {currentPath.map((folder, index) => (
        <div key={index} className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigateToBreadcrumb(index)}
            className={index === currentPath.length - 1 ? "font-semibold" : ""}
          >
            {folder}
          </Button>
          {index < currentPath.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
        </div>
      ))}
    </nav>
  )
}