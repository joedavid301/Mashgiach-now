'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type UserRole = 'business' | 'mashgiach' | null

export default function Navbar() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: userRow, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!error) {
        setRole((userRow?.role as UserRole) || null)
      }

      setLoading(false)
    }

    loadUserRole()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="text-sm text-gray-500">Loading navigation...</div>
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {role === 'business' && (
          <>
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <Link
              href="/directory"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Directory
            </Link>

            <Link
              href="/dashboard/jobs"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Jobs
            </Link>

            <Link
              href="/dashboard/unlocked"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              My Unlocks
            </Link>

            <Link
              href="/dashboard/billing"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Billing
            </Link>
          </>
        )}

        {role === 'mashgiach' && (
          <>
            <Link
              href="/mashgiach/dashboard"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <Link
              href="/mashgiach/profile"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              My Profile
            </Link>

            <Link
              href="/mashgiach/jobs"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Jobs
            </Link>
          </>
        )}

        <button
          onClick={handleLogout}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Logout
        </button>
      </div>
    </div>
  )
}