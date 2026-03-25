'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Navbar from '@/app/components/Navbar'

type MashgiachProfile = {
  user_id: string
  first_name: string
  last_name: string
  city: string
  phone: string | null
}

export default function UnlockedProfilesPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<MashgiachProfile[]>([])
  const [error, setError] = useState<string | null>(null)

  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number>(0)
  const [used, setUsed] = useState<number>(0)

  useEffect(() => {
    async function loadUnlockedProfiles() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Load business profile
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

      setSubscriptionStatus(businessProfile.subscription_status || 'inactive')

      const limit = businessProfile.monthly_unlock_limit ?? 20
      const usedCount = businessProfile.unlocks_used_this_month ?? 0

      setUsed(usedCount)
      setRemaining(limit - usedCount)

      // Load unlocks
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

      const mashgiachIds = unlockRows.map((row) => row.mashgiach_user_id)

      const { data: profileRows, error: profileError } = await supabase
        .from('mashgiach_profiles')
        .select('user_id, first_name, last_name, city, phone')
        .in('user_id', mashgiachIds)

      if (profileError) {
        setError('Could not load profile details.')
        setLoading(false)
        return
      }

      const profileMap = new Map(profileRows.map((p) => [p.user_id, p]))

      const orderedProfiles = mashgiachIds
        .map((id) => profileMap.get(id))
        .filter(Boolean) as MashgiachProfile[]

      setProfiles(orderedProfiles)
      setLoading(false)
    }

    loadUnlockedProfiles()
  }, [router])

  if (loading) return <div className="p-6">Loading unlocked profiles...</div>
  if (error) return <div className="p-6">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Navbar />

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Unlocked Profiles
        </h1>

        {/* STATS */}
        <div className="mb-8 rounded-2xl border bg-white p-5 shadow-sm grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Subscription</p>
            <p className="text-xl font-semibold">{subscriptionStatus}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-xl font-semibold">{remaining}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Used</p>
            <p className="text-xl font-semibold">{used}</p>
          </div>
        </div>

        {/* PROFILES */}
        {profiles.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {profiles.map((profile) => (
              <Link
                key={profile.user_id}
                href={`/mashgiach/${profile.user_id}`}
                className="rounded-2xl border bg-white p-6 shadow-sm hover:bg-gray-50"
              >
                <h2 className="text-xl font-semibold">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-sm text-gray-600">{profile.city}</p>
                <p className="mt-4 text-sm">
                  Phone: {profile.phone || 'Not available'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6 text-gray-600 shadow-sm">
            No unlocked profiles yet.
          </div>
        )}
      </div>
    </div>
  )
}