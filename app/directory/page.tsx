'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import Navbar from '@/app/components/Navbar'

type MashgiachProfile = {
  user_id: string
  first_name: string
  last_name: string
  city: string
  phone: string | null
  years_experience: string | number | null
  availability_type: string | null
  min_hourly_rate: string | number | null
  shomer_shabbos_mashgiach: boolean | null
  vegetable_check_certified: boolean | null
  can_check_vegetables: boolean | null
  other_tasks: string[] | null
  is_active: boolean | null
}

export default function DirectoryPage() {
  const [profiles, setProfiles] = useState<MashgiachProfile[]>([])
  const [loading, setLoading] = useState(true)

  const [userId, setUserId] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive')
  const [remaining, setRemaining] = useState<number>(0)

  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [unlockingId, setUnlockingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)

        const { data: bp } = await supabase
          .from('business_profiles')
          .select('subscription_status, monthly_unlock_limit, unlocks_used_this_month')
          .eq('user_id', user.id)
          .single()

        if (bp) {
          setSubscriptionStatus(bp.subscription_status || 'inactive')

          const limit = bp.monthly_unlock_limit ?? 20
          const used = bp.unlocks_used_this_month ?? 0

          setRemaining(Math.max(limit - used, 0))
        }

        const { data: unlocks } = await supabase
          .from('profile_unlocks')
          .select('mashgiach_user_id')
          .eq('business_user_id', user.id)

        setUnlockedIds((unlocks || []).map((u: { mashgiach_user_id: string }) => u.mashgiach_user_id))
      }

      const { data: profileRows } = await supabase
        .from('mashgiach_profiles')
        .select('*')
        .eq('is_active', true)

      setProfiles(profileRows || [])
      setLoading(false)
    }

    load()
  }, [])

  async function handleUnlock(mashgiachUserId: string) {
    if (!userId) return

    if (subscriptionStatus !== 'active') {
      alert('You need an active subscription.')
      return
    }

    if (remaining <= 0) {
      alert('You have reached your monthly unlock limit.')
      return
    }

    setUnlockingId(mashgiachUserId)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        alert('Your session expired. Please log in again.')
        return
      }

      const res = await fetch('/api/unlocks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mashgiachUserId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to unlock')
        return
      }

      setUnlockedIds((prev) =>
        prev.includes(mashgiachUserId) ? prev : [...prev, mashgiachUserId]
      )

      if (typeof data.unlocksRemaining === 'number') {
        setRemaining(data.unlocksRemaining)
      }
    } catch (err) {
      console.error(err)
      alert('Unlock failed')
    } finally {
      setUnlockingId(null)
    }
  }

  if (loading) return <div className="p-6">Loading directory...</div>

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <h1 className="mb-6 text-3xl font-bold">Mashgiach Directory</h1>

        <div className="mb-6 rounded-xl border bg-white p-4 text-sm text-gray-600">
          {subscriptionStatus === 'active' ? (
            <>You have {remaining} unlocks remaining this month</>
          ) : (
            <>Subscription required to unlock profiles</>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => {
            const isUnlocked = unlockedIds.includes(profile.user_id)

            const vegetableCertified =
              profile.vegetable_check_certified ?? profile.can_check_vegetables

            return (
              <div
                key={profile.user_id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold">
                  {profile.first_name}{' '}
                  {isUnlocked
                    ? profile.last_name
                    : `${profile.last_name?.charAt(0) || ''}.`}
                </h2>

                <p className="text-gray-600">{profile.city}</p>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <strong>Experience:</strong>{' '}
                    {profile.years_experience || 'Not listed'}
                  </p>
                  <p>
                    <strong>Availability:</strong>{' '}
                    {profile.availability_type || 'Not listed'}
                  </p>
                  <p>
                    <strong>Rate:</strong>{' '}
                    {profile.min_hourly_rate
                      ? `$${profile.min_hourly_rate}/hr`
                      : 'Not listed'}
                  </p>
                  <p>
                    <strong>Shomer Shabbos:</strong>{' '}
                    {profile.shomer_shabbos_mashgiach ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Vegetable Certified:</strong>{' '}
                    {vegetableCertified ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Other Tasks:</strong>{' '}
                    {profile.other_tasks?.length
                      ? profile.other_tasks.join(', ')
                      : 'Not listed'}
                  </p>
                </div>

                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  {isUnlocked ? (
                    <div className="space-y-3">
                      <p>
                        <strong>Phone:</strong> {profile.phone || 'Not available'}
                      </p>

                      <Link href={`/directory/${profile.user_id}`}>
                        <button className="rounded-xl bg-black px-4 py-2 text-white transition hover:bg-gray-800">
                          View Profile
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUnlock(profile.user_id)}
                      disabled={unlockingId === profile.user_id}
                      className="rounded-xl bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
                    >
                      {unlockingId === profile.user_id
                        ? 'Unlocking...'
                        : subscriptionStatus !== 'active'
                        ? 'Subscription Required'
                        : remaining <= 0
                        ? 'Limit Reached'
                        : 'Unlock Profile'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}