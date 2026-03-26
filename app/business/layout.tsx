import Navbar from '@/app/components/Navbar'
import { requireBusinessUser } from '@/app/lib/auth'

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireBusinessUser()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <Navbar />
        {children}
      </div>
    </div>
  )
}
