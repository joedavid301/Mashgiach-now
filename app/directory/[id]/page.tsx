'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type MashgiachProfile = {
  user_id: string
  first_name: string | null
  last_name: string | null
  city: string | null
  phone: string | null
  years_experience: string | null
  certifications: string | null
  can_check_vegetables: boolean | null
  food_safety_certified: boolean | null
  availability_type: string | null
  min_hourly_rate: string | null
  bio: string | null
  profile_photo_url: string | null
}

export default function MashgiachProfileDetailPage() {
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<MashgiachProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('mashgiach_profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          city,
          phone,
          years_experience,
          certifications,
          can_check_vegetables,
          food_safety_certified,
          availability_type,
          min_hourly_rate,
          bio,
          profile_photo_url
        `)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data) {
        setError('Profile not found.')
        setLoading(false)
        return
      }

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [userId])

  function fullName() {
    if (!profile) return ''
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Mashgiach'
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl p-6 text-sm text-gray-600">Loading profile...</div>
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link
          href="/directory"
          className="mb-6 inline-block text-sm text-gray-600 hover:text-black"
        >
          ← Back to Directory
        </Link>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-red-600">{error || 'Profile not found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        href="/directory"
        className="mb-6 inline-block text-sm text-gray-600 hover:text-black"
      >
        ← Back to Directory
      </Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <img
            src={profile.profile_photo_url || '/placeholder-profile.png'}
            alt={fullName()}
            className="h-28 w-28 rounded-full border object-cover"
          />

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{fullName()}</h1>

            <p className="mt-2 text-sm text-gray-600">
              {profile.city || 'City not listed'}
            </p>

            {profile.phone && (
              <p className="mt-1 text-sm text-gray-700">{profile.phone}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {profile.availability_type && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {profile.availability_type}
                </span>
              )}

              {profile.min_hourly_rate && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  Min Rate: {profile.min_hourly_rate}
                </span>
              )}

              {profile.years_experience && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  Experience: {profile.years_experience}
                </span>
              )}

              {profile.can_check_vegetables && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  Vegetable Checking
                </span>
              )}

              {profile.food_safety_certified && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  Food Safety Certified
                </span>
              )}
            </div>
          </div>
        </div>

        {profile.certifications && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900">Certifications</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
              {profile.certifications}
            </p>
          </div>
        )}

        {profile.bio && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900">About</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
              {profile.bio}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}