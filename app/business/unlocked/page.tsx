'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type MashgiachProfile = {
  user_id: string
  first_name: string | null
  last_name: string | null
  city: string | null
  phone: string | null
}

type UnlockRow = {
  mashgiach_user_id: string
  created_at: string
}

export default function UnlockedProfilesPage() {
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<MashgiachProfile[]>([])
  const [error, setError] = useState<string | null>(null)

  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive')
  const [remaining, setRemaining] = useState<number>(0)
  const [used, setUsed] = useState<number>(0)

  useEffect(() => {
    async function loadUnlockedProfiles() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Could not load your account.')
        setLoading(false)
        return
      }

      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select(
          'subscription_status, monthly_unlock_limit, extra_unlock_credits, unlocks_used_this_month'
        )
        .eq('user_id', user.id)
        .single()

      if (businessError || !businessProfile) {
        setError('Could not load business profile.')
        setLoading(false)
        return
      }

      const status = businessProfile.subscription_status ?? 'inactive'

      if (
        typeof businessProfile.monthly_unlock_limit !== 'number' ||
        typeof businessProfile.extra_unlock_credits !== 'number' ||
        typeof businessProfile.unlocks_used_this_month !== 'number'
      ) {
        setError('Business billing fields are missing from this profile.')
        setLoading(false)
        return
      }

      const limit =
        businessProfile.monthly_unlock_limit + businessProfile.extra_unlock_credits
      const usedCount = businessProfile.unlocks_used_this_month
      const remainingCount = Math.max(limit - usedCount, 0)

      setSubscriptionStatus(status)
      setUsed(usedCount)
      setRemaining(remainingCount)

      const { data: unlockRows, error: unlockError } = await supabase
        .from('profile_unlocks')
        .select('mashgiach_user_id, created_at')
        .eq('business_user_id', user.id)
        .order('created_at', { ascending: false })

      if (unlockError) {
        setError('Could not load unlocked profiles.')
        setLoading(false)
        return
      }

      if (!unlockRows || unlockRows.length === 0) {
        setProfiles([])
        setLoading(false)
        return
      }

      const typedUnlockRows = unlockRows as UnlockRow[]
      const mashgiachIds = typedUnlockRows.map((row) => row.mashgiach_user_id)

      const { data: profileRows, error: profileError } = await supabase
        .from('mashgiach_profiles')
        .select('user_id, first_name, last_name, city, phone')
        .in('user_id', mashgiachIds)

      if (profileError) {
        setError('Could not load profile details.')
        setLoading(false)
        return
      }

      const safeProfileRows = (profileRows ?? []) as MashgiachProfile[]
      const profileMap = new Map(safeProfileRows.map((profile) => [profile.user_id, profile]))

      const orderedProfiles = mashgiachIds
        .map((id) => profileMap.get(id))
        .filter(Boolean) as MashgiachProfile[]

      setProfiles(orderedProfiles)
      setLoading(false)
    }

    loadUnlockedProfiles()
  }, [])

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Loading unlocked profiles...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Unlocked Profiles</h1>
        <p className="mt-2 text-sm text-gray-600">
          View the mashgichim your business has already unlocked.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Subscription</p>
          <p className="mt-1 text-xl font-semibold capitalize">{subscriptionStatus}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Remaining</p>
          <p className="mt-1 text-xl font-semibold">{remaining}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Used</p>
          <p className="mt-1 text-xl font-semibold">{used}</p>
        </div>
      </div>

      {subscriptionStatus === 'active' && remaining <= 0 && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
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

      {profiles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => {
            const fullName =
              `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Mashgiach'

            return (
              <Link
                key={profile.user_id}
                href={`/directory/${profile.user_id}`}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:bg-gray-50 hover:shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {profile.city || 'City not listed'}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Unlocked
                  </span>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Phone:</span>{' '}
                    {profile.phone || 'Not available'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
          No unlocked profiles yet.
        </div>
      )}
    </div>
  )
}
