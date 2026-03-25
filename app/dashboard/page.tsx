'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Navbar from '@/app/components/Navbar'

type MashgiachProfile = {
  user_id: string
  first_name: string
  last_name: string
  city: string
}

export default function DashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [used, setUsed] = useState(0)
  const [unlockCount, setUnlockCount] = useState(0)
  const [recentProfiles, setRecentProfiles] = useState<MashgiachProfile[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // role check
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!userRow || userRow.role !== 'business') {
        setError('Access denied. Business account required.')
        setLoading(false)
        return
      }

      // business profile (NEW SYSTEM)
      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select(
          'business_name, subscription_status, monthly_unlock_limit, unlocks_used_this_month'
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError || !profile) {
        setError('Business profile not found.')
        setLoading(false)
        return
      }

      setBusinessName(profile.business_name || 'Dashboard')

      const limit = profile.monthly_unlock_limit ?? 20
      const usedCount = profile.unlocks_used_this_month ?? 0

      setUsed(usedCount)
      setRemaining(limit - usedCount)

      // total unlock count
      const { count } = await supabase
        .from('profile_unlocks')
        .select('*', { count: 'exact', head: true })
        .eq('business_user_id', user.id)

      setUnlockCount(count || 0)

      // recent unlocks
      const { data: unlockRows } = await supabase
        .from('profile_unlocks')
        .select('mashgiach_user_id, created_at')
        .eq('business_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (unlockRows && unlockRows.length > 0) {
        const ids = unlockRows.map((u) => u.mashgiach_user_id)

        const { data: profiles } = await supabase
          .from('mashgiach_profiles')
          .select('user_id, first_name, last_name, city')
          .in('user_id', ids)

        const map = new Map(
          (profiles || []).map((p: MashgiachProfile) => [p.user_id, p])
        )

        const ordered = ids
          .map((id) => map.get(id))
          .filter(Boolean) as MashgiachProfile[]

        setRecentProfiles(ordered)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  if (loading) return <div className="p-6">Loading dashboard...</div>
  if (error) return <div className="p-6">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        <Navbar />

        <h1 className="mb-6 text-3xl font-bold">
          {businessName}
        </h1>

        {/* STATS */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Unlocks Remaining</p>
            <p className="text-3xl font-bold">{remaining}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Used This Month</p>
            <p className="text-3xl font-bold">{used}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Total Unlocks</p>
            <p className="text-3xl font-bold">{unlockCount}</p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>

          <div className="flex flex-wrap gap-4">
            <Link href="/directory" className="rounded-xl bg-black px-5 py-3 text-white">
              Browse Mashgiachim
            </Link>

            <Link href="/dashboard/unlocked" className="rounded-xl border px-5 py-3">
              View Unlocked Profiles
            </Link>
          </div>
        </div>

        {/* RECENT */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Recently Unlocked Mashgiachim
          </h2>

          {recentProfiles.length ? (
            <div className="space-y-3">
              {recentProfiles.map((profile) => (
                <Link
                  key={profile.user_id}
                  href={`/mashgiach/${profile.user_id}`}
                  className="block rounded-xl border bg-white p-4 hover:bg-gray-50"
                >
                  {profile.first_name} {profile.last_name} — {profile.city}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No profiles unlocked yet</p>
          )}
        </div>

      </div>
    </div>
  )
}