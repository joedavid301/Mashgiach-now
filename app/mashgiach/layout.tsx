import Navbar from '@/app/components/Navbar'
import { requireMashgiachUser } from '@/app/lib/auth'

export default async function MashgiachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireMashgiachUser()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <Navbar />
        {children}
      </div>
    </div>
  )
}