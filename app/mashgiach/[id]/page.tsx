'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

type MashgiachProfile = {
  user_id: string
  first_name: string
  last_name: string
  city: string
  phone: string | null
  years_experience: string | number | null
  certifications: string | null
  can_check_vegetables: boolean | null
  food_safety_certified: boolean | null
  availability_type: string | null
  min_hourly_rate: string | number | null
  bio: string | null
  profile_photo_url: string | null
  shomer_shabbos_mashgiach: boolean | null
  vegetable_check_certified: boolean | null
  willing_veg_check_certification: boolean | null
  agencies_certified_with: string[] | null
  other_agencies: string | null
  willing_to_become_certified: boolean | null
  other_tasks: string[] | null
  character_reference_name: string | null
  character_reference_phone: string | null
  character_reference_relationship: string | null
  rabbinic_reference_name: string | null
  rabbinic_reference_phone: string | null
  rabbinic_reference_title: string | null
  rabbinic_reference_organization: string | null
}

type UserRole = 'business' | 'mashgiach' | null

export default function MashgiachProfilePage() {
  const params = useParams()
  const id = params?.id as string

  const [profile, setProfile] = useState<MashgiachProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [viewerRole, setViewerRole] = useState<UserRole>(null)
  const [viewerId, setViewerId] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setViewerId(user.id)

        const { data: userRow } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = (userRow?.role as UserRole) || null
        setViewerRole(role)

        if (role === 'business') {
          const { data: unlock } = await supabase
            .from('profile_unlocks')
            .select('id')
            .eq('business_user_id', user.id)
            .eq('mashgiach_user_id', id)
            .maybeSingle()

          if (unlock) {
            setIsUnlocked(true)
          }
        }

        if (user.id === id) {
          setIsUnlocked(true)
        }
      }

      const { data: profileData, error } = await supabase
        .from('mashgiach_profiles')
        .select('*')
        .eq('user_id', id)
        .single()

      if (error || !profileData) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(profileData as MashgiachProfile)
      setLoading(false)
    }

    if (id) {
      loadProfile()
    }
  }, [id])

  if (loading) {
    return <div className="p-6">Loading profile...</div>
  }

  if (!profile) {
    return <div className="p-6">Profile not found</div>
  }

  const vegetableCertified =
    profile.vegetable_check_certified ?? profile.can_check_vegetables ?? false

  const agencies = [
    ...(profile.agencies_certified_with || []),
    ...(profile.other_agencies
      ? profile.other_agencies
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={`${profile.first_name} ${profile.last_name}`}
                className="h-28 w-28 rounded-2xl border object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl border bg-gray-100 text-sm text-gray-500">
                No photo
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h1>

              <p className="mt-2 text-gray-600">{profile.city}</p>

              <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                <p>
                  <strong>Phone:</strong>{' '}
                  {isUnlocked
                    ? profile.phone || 'Not available'
                    : 'Unlock required'}
                </p>

                <p>
                  <strong>Availability:</strong>{' '}
                  {profile.availability_type || 'Not listed'}
                </p>

                <p>
                  <strong>Experience:</strong>{' '}
                  {profile.years_experience || 'Not listed'}
                </p>

                <p>
                  <strong>Rate:</strong>{' '}
                  {profile.min_hourly_rate
                    ? `$${profile.min_hourly_rate}/hr`
                    : 'Not listed'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6">
            <section className="rounded-2xl bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Kashrus Qualifications
              </h2>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Can serve as a Shomer Shabbos mashgiach:</strong>{' '}
                  {profile.shomer_shabbos_mashgiach ? 'Yes' : 'No'}
                </p>

                <p>
                  <strong>Certified for vegetable checking:</strong>{' '}
                  {vegetableCertified ? 'Yes' : 'No'}
                </p>

                <p>
                  <strong>Willing to become vegetable-check certified:</strong>{' '}
                  {profile.willing_veg_check_certification ? 'Yes' : 'No'}
                </p>

                <p>
                  <strong>
                    Not currently certified, but willing to become certified:
                  </strong>{' '}
                  {profile.willing_to_become_certified ? 'Yes' : 'No'}
                </p>

                <p>
                  <strong>Food safety certified:</strong>{' '}
                  {profile.food_safety_certified ? 'Yes' : 'No'}
                </p>

                <p>
                  <strong>Certified with agencies:</strong>{' '}
                  {agencies.length > 0 ? agencies.join(', ') : 'Not listed'}
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Other Tasks Willing to Perform
              </h2>

              <div className="mt-4 text-sm text-gray-700">
                {profile.other_tasks && profile.other_tasks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.other_tasks.map((task) => (
                      <span
                        key={task}
                        className="rounded-full border bg-white px-3 py-1"
                      >
                        {task}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>Not listed</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Bio</h2>
              <p className="mt-4 text-sm text-gray-700">
                {profile.bio || 'No bio provided.'}
              </p>
            </section>

            <section className="rounded-2xl bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">
                References
              </h2>

              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Character Reference
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Name:</strong>{' '}
                      {profile.character_reference_name || 'Not listed'}
                    </p>
                    <p>
                      <strong>Phone:</strong>{' '}
                      {isUnlocked
                        ? profile.character_reference_phone || 'Not listed'
                        : 'Unlock required'}
                    </p>
                    <p>
                      <strong>Relationship:</strong>{' '}
                      {profile.character_reference_relationship || 'Not listed'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Rabbinic Reference
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Name:</strong>{' '}
                      {profile.rabbinic_reference_name || 'Not listed'}
                    </p>
                    <p>
                      <strong>Phone:</strong>{' '}
                      {isUnlocked
                        ? profile.rabbinic_reference_phone || 'Not listed'
                        : 'Unlock required'}
                    </p>
                    <p>
                      <strong>Title:</strong>{' '}
                      {profile.rabbinic_reference_title || 'Not listed'}
                    </p>
                    <p>
                      <strong>Shul / Organization:</strong>{' '}
                      {profile.rabbinic_reference_organization || 'Not listed'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {!isUnlocked && viewerRole === 'business' && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                This profile has not been unlocked yet. Contact details and
                reference phone numbers remain hidden until unlocked.
              </div>
            )}

            {!viewerId && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                Log in as a business account to unlock full contact details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}