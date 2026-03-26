'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

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
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('subscription_status, monthly_unlock_limit, unlocks_used_this_month')
        .eq('user_id', user.id)
        .single()

      if (businessError || !businessProfile) {
        setError('Could not load business profile.')
        setLoading(false)
        return
      }

      const status = businessProfile.subscription_status ?? 'inactive'
      const limit = businessProfile.monthly_unlock_limit ?? 20
      const usedCount = businessProfile.unlocks_used_this_month ?? 0
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
  }, [router])

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