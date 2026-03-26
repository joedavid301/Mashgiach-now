'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type UserRole = 'business' | 'mashgiach' | null

function navLinkClasses(active: boolean) {
  return active
    ? 'rounded-xl bg-black px-4 py-2 text-sm font-medium text-white'
    : 'rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

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
              href="/business/dashboard"
              className={navLinkClasses(pathname === '/business/dashboard')}
            >
              Dashboard
            </Link>

            <Link
              href="/directory"
              className={navLinkClasses(
                pathname === '/directory' || pathname.startsWith('/directory/')
              )}
            >
              Directory
            </Link>

            <Link
              href="/business/jobs"
              className={navLinkClasses(
                pathname === '/business/jobs' || pathname.startsWith('/business/jobs/')
              )}
            >
              Jobs
            </Link>

            <Link
              href="/business/unlocked"
              className={navLinkClasses(pathname === '/business/unlocked')}
            >
              My Unlocks
            </Link>

            <Link
              href="/business/billing"
              className={navLinkClasses(
                pathname === '/business/billing' ||
                  pathname.startsWith('/business/billing/')
              )}
            >
              Billing
            </Link>
          </>
        )}

        {role === 'mashgiach' && (
          <>
            <Link
              href="/mashgiach/dashboard"
              className={navLinkClasses(pathname === '/mashgiach/dashboard')}
            >
              Dashboard
            </Link>

            <Link
              href="/mashgiach/profile"
              className={navLinkClasses(pathname === '/mashgiach/profile')}
            >
              My Profile
            </Link>

            <Link
              href="/mashgiach/jobs"
              className={navLinkClasses(
                pathname === '/mashgiach/jobs' || pathname.startsWith('/mashgiach/jobs/')
              )}
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