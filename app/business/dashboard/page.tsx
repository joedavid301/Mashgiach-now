'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type MashgiachProfile = {
  user_id: string
  first_name: string
  last_name: string
  city: string
  profile_photo_url: string | null
}

export default function DashboardPage() {
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [contactName, setContactName] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
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
        setError('Could not load your account.')
        setLoading(false)
        return
      }

      const { data: userRow, error: userRowError } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .maybeSingle()

      if (userRowError) {
        setError(userRowError.message)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('business_profiles')
        .select(
          'business_name, contact_name, subscription_status, monthly_unlock_limit, extra_unlock_credits, unlocks_used_this_month'
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile) {
        setError('Business profile not found.')
        setLoading(false)
        return
      }

      if (
        typeof profile.monthly_unlock_limit !== 'number' ||
        typeof profile.extra_unlock_credits !== 'number' ||
        typeof profile.unlocks_used_this_month !== 'number'
      ) {
        setError('Business billing fields are missing from this profile.')
        setLoading(false)
        return
      }

      setAccountEmail(userRow?.email || user.email || null)
      setBusinessName(profile.business_name || 'Dashboard')
      setContactName(profile.contact_name || null)
      setSubscriptionStatus(profile.subscription_status || 'inactive')

      const limit = profile.monthly_unlock_limit + profile.extra_unlock_credits
      const usedCount = profile.unlocks_used_this_month

      setUsed(usedCount)
      setRemaining(limit - usedCount)

      const { count } = await supabase
        .from('profile_unlocks')
        .select('*', { count: 'exact', head: true })
        .eq('business_user_id', user.id)

      setUnlockCount(count || 0)

      const { data: unlockRows } = await supabase
        .from('profile_unlocks')
        .select('mashgiach_user_id')
        .eq('business_user_id', user.id)
        .limit(5)

      if (unlockRows && unlockRows.length > 0) {
        const ids = unlockRows.map((u) => u.mashgiach_user_id)

        const { data: profiles } = await supabase
          .from('mashgiach_profiles')
          .select(
            'user_id, first_name, last_name, city, profile_photo_url'
          )
          .in('user_id', ids)

        setRecentProfiles((profiles as MashgiachProfile[]) || [])
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (loading) return <div className="p-6">Loading dashboard...</div>
  if (error) return <div className="p-6">{error}</div>

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{businessName}</h1>

      {!businessName?.trim() && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-amber-900">Complete Business Profile</h2>
              <p className="mt-1 text-sm text-amber-800">Add your business details so your account is fully set up.</p>
            </div>
            <Link href="/business/profile" className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800">Complete Business Profile</Link>
          </div>
        </div>
      )}

      <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Account Summary</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
            <p className="mt-1 text-sm text-gray-900">{accountEmail || 'Not available'}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Business Name</p>
            <p className="mt-1 text-sm text-gray-900">{businessName || 'Not available'}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact Name</p>
            <p className="mt-1 text-sm text-gray-900">{contactName || 'Not available'}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Subscription Status</p>
            <p className="mt-1 text-sm capitalize text-gray-900">{subscriptionStatus || 'inactive'}</p>
          </div>
        </div>
      </div>

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

      {subscriptionStatus === 'active' && remaining <= 0 && (
        <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-900">
            You have 0 unlocks remaining this month.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Buy 5 more unlocks for $25 to continue.
          </p>
          <Link
            href="/business/billing"
            className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Buy 5 More Unlocks for $25
          </Link>
        </div>
      )}

      <div className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/directory"
            className="rounded-xl bg-black px-5 py-3 text-white"
          >
            Browse Mashgiachim
          </Link>

          <Link
            href="/business/profile"
            className="rounded-xl border px-5 py-3"
          >
            Edit Business Profile
          </Link>

          <Link
            href="/business/unlocked"
            className="rounded-xl border px-5 py-3"
          >
            View Unlocked Profiles
          </Link>

          <Link
            href="/business/jobs"
            className="rounded-xl border px-5 py-3"
          >
            Manage Jobs
          </Link>
        </div>
      </div>

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
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-full border bg-gray-100">
                    {profile.profile_photo_url ? (
                      <img
                        src={profile.profile_photo_url}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        No photo
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="font-medium text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {profile.city}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No profiles unlocked yet</p>
        )}
      </div>
    </div>
  )
}
