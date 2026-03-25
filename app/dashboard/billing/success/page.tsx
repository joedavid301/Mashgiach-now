'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function BillingSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/billing')
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Navbar />

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Billing Success
          </h1>

          <p className="text-sm text-gray-600">
            Payment received. Syncing your subscription...
          </p>
        </div>
      </div>
    </div>
  )
}