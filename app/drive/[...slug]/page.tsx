import { DriveUi } from "@/components/DriveUi"

export default function DrivePage({ params }: { params: { slug: string[] } }) {
  return (
    <div className="flex flex-col h-screen">
      <DriveUi initialPath={params.slug} />
    </div>
  )
}
