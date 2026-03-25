'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const AGENCY_OPTIONS = [
  'OU',
  'OK',
  'Kof-K',
  'Star-K',
  'cRc',
  'Chof-K',
  'EarthKosher',
  'KVH',
  'Local Vaad',
]

const OTHER_TASK_OPTIONS = [
  'Prep',
  'Bartender',
  'Server',
  'Cashier',
  'Expo',
  'Food Runner',
  'Dishwasher',
  'Host',
  'Basic Kitchen Help',
]

type MashgiachProfileRow = {
  user_id: string
  first_name: string | null
  last_name: string | null
  city: string | null
  phone: string | null
  years_experience: string | number | null
  certifications: string | null
  can_check_vegetables: boolean | null
  food_safety_certified: boolean | null
  availability_type: string | null
  min_hourly_rate: string | number | null
  bio: string | null
  is_active: boolean | null
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

export default function MashgiachProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [availabilityType, setAvailabilityType] = useState('part-time')
  const [minHourlyRate, setMinHourlyRate] = useState('')
  const [bio, setBio] = useState('')

  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')

  const [shomerShabbosMashgiach, setShomerShabbosMashgiach] = useState(false)
  const [vegetableCheckCertified, setVegetableCheckCertified] = useState(false)
  const [willingVegCheckCertification, setWillingVegCheckCertification] =
    useState(false)
  const [willingToBecomeCertified, setWillingToBecomeCertified] =
    useState(false)

  const [foodSafetyCertified, setFoodSafetyCertified] = useState(false)
  const [agenciesCertifiedWith, setAgenciesCertifiedWith] = useState<string[]>(
    []
  )
  const [otherAgencies, setOtherAgencies] = useState('')
  const [otherTasks, setOtherTasks] = useState<string[]>([])

  const [characterReferenceName, setCharacterReferenceName] = useState('')
  const [characterReferencePhone, setCharacterReferencePhone] = useState('')
  const [characterReferenceRelationship, setCharacterReferenceRelationship] =
    useState('')

  const [rabbinicReferenceName, setRabbinicReferenceName] = useState('')
  const [rabbinicReferencePhone, setRabbinicReferencePhone] = useState('')
  const [rabbinicReferenceTitle, setRabbinicReferenceTitle] = useState('')
  const [rabbinicReferenceOrganization, setRabbinicReferenceOrganization] =
    useState('')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setMessage(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setMessage('Please log in first.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('mashgiach_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      if (data) {
        const profile = data as MashgiachProfileRow

        setFirstName(profile.first_name || '')
        setLastName(profile.last_name || '')
        setCity(profile.city || '')
        setPhone(profile.phone || '')
        setYearsExperience(
          profile.years_experience !== null &&
            profile.years_experience !== undefined
            ? String(profile.years_experience)
            : ''
        )
        setAvailabilityType(profile.availability_type || 'part-time')
        setMinHourlyRate(
          profile.min_hourly_rate !== null &&
            profile.min_hourly_rate !== undefined
            ? String(profile.min_hourly_rate)
            : ''
        )
        setBio(profile.bio || '')

        setProfilePhotoUrl(profile.profile_photo_url || '')

        setShomerShabbosMashgiach(
          profile.shomer_shabbos_mashgiach ?? false
        )
        setVegetableCheckCertified(
          profile.vegetable_check_certified ??
            profile.can_check_vegetables ??
            false
        )
        setWillingVegCheckCertification(
          profile.willing_veg_check_certification ?? false
        )
        setWillingToBecomeCertified(
          profile.willing_to_become_certified ?? false
        )

        setFoodSafetyCertified(profile.food_safety_certified ?? false)
        setAgenciesCertifiedWith(profile.agencies_certified_with || [])
        setOtherAgencies(profile.other_agencies || '')
        setOtherTasks(profile.other_tasks || [])

        setCharacterReferenceName(profile.character_reference_name || '')
        setCharacterReferencePhone(profile.character_reference_phone || '')
        setCharacterReferenceRelationship(
          profile.character_reference_relationship || ''
        )

        setRabbinicReferenceName(profile.rabbinic_reference_name || '')
        setRabbinicReferencePhone(profile.rabbinic_reference_phone || '')
        setRabbinicReferenceTitle(profile.rabbinic_reference_title || '')
        setRabbinicReferenceOrganization(
          profile.rabbinic_reference_organization || ''
        )
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  function toggleAgency(agency: string) {
    setAgenciesCertifiedWith((prev) =>
      prev.includes(agency)
        ? prev.filter((item) => item !== agency)
        : [...prev, agency]
    )
  }

  function toggleOtherTask(task: string) {
    setOtherTasks((prev) =>
      prev.includes(task)
        ? prev.filter((item) => item !== task)
        : [...prev, task]
    )
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setMessage(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Please log in first.')
      setUploadingPhoto(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) {
      setMessage(
        `Photo upload failed. Make sure the "profile-photos" bucket exists. ${uploadError.message}`
      )
      setUploadingPhoto(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    setProfilePhotoUrl(publicUrlData.publicUrl)
    setUploadingPhoto(false)
    setMessage('Photo uploaded. Save profile to keep it.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Please log in first.')
      setSaving(false)
      return
    }

    if (!firstName.trim() || !lastName.trim() || !city.trim() || !phone.trim()) {
      setMessage('First name, last name, city, and phone are required.')
      setSaving(false)
      return
    }

    const payload = {
      user_id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      city: city.trim(),
      phone: phone.trim(),
      years_experience: yearsExperience.trim() || null,
      availability_type: availabilityType,
      min_hourly_rate: minHourlyRate.trim() || null,
      bio: bio.trim() || null,

      profile_photo_url: profilePhotoUrl || null,

      shomer_shabbos_mashgiach: shomerShabbosMashgiach,
      vegetable_check_certified: vegetableCheckCertified,
      can_check_vegetables: vegetableCheckCertified,
      willing_veg_check_certification: willingVegCheckCertification,
      willing_to_become_certified: willingToBecomeCertified,

      food_safety_certified: foodSafetyCertified,
      certifications: agenciesCertifiedWith.length
        ? agenciesCertifiedWith.join(', ')
        : null,
      agencies_certified_with: agenciesCertifiedWith,
      other_agencies: otherAgencies.trim() || null,
      other_tasks: otherTasks,

      character_reference_name: characterReferenceName.trim() || null,
      character_reference_phone: characterReferencePhone.trim() || null,
      character_reference_relationship:
        characterReferenceRelationship.trim() || null,

      rabbinic_reference_name: rabbinicReferenceName.trim() || null,
      rabbinic_reference_phone: rabbinicReferencePhone.trim() || null,
      rabbinic_reference_title: rabbinicReferenceTitle.trim() || null,
      rabbinic_reference_organization:
        rabbinicReferenceOrganization.trim() || null,

      is_active: true,
    }

    const { error } = await supabase
      .from('mashgiach_profiles')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Profile saved successfully.')
    setSaving(false)
  }

  if (loading) {
    return <div className="p-6">Loading profile...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Mashgiach Profile
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Complete your profile so businesses can understand your experience,
          certifications, and flexibility.
        </p>

        {message && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-10">
          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Basic Info</h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Profile Photo (optional)
              </label>

              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  className="mb-3 h-24 w-24 rounded-full border object-cover"
                />
              ) : (
                <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border bg-gray-100 text-sm text-gray-500">
                  No photo
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="block w-full text-sm"
              />

              {uploadingPhoto && (
                <p className="mt-2 text-sm text-gray-500">Uploading photo...</p>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Years of Experience
                </label>
                <input
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Availability Type
                </label>
                <select
                  value={availabilityType}
                  onChange={(e) => setAvailabilityType(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="part-time">Part-time</option>
                  <option value="full-time">Full-time</option>
                  <option value="both">Both</option>
                  <option value="temporary">Temporary</option>
                  <option value="seasonal">Seasonal</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Minimum Hourly Rate
                </label>
                <input
                  value={minHourlyRate}
                  onChange={(e) => setMinHourlyRate(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                  placeholder="Example: 25"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="Tell businesses a little about yourself."
              />
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Kashrus Qualifications
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={shomerShabbosMashgiach}
                  onChange={(e) =>
                    setShomerShabbosMashgiach(e.target.checked)
                  }
                />
                Can serve as a Shomer Shabbos mashgiach
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={vegetableCheckCertified}
                  onChange={(e) =>
                    setVegetableCheckCertified(e.target.checked)
                  }
                />
                Certified for vegetable checking
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={willingVegCheckCertification}
                  onChange={(e) =>
                    setWillingVegCheckCertification(e.target.checked)
                  }
                />
                Willing to become vegetable-check certified
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={willingToBecomeCertified}
                  onChange={(e) =>
                    setWillingToBecomeCertified(e.target.checked)
                  }
                />
                Not currently certified, but willing to become certified
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={foodSafetyCertified}
                  onChange={(e) => setFoodSafetyCertified(e.target.checked)}
                />
                Food safety certified
              </label>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Certified with agencies
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {AGENCY_OPTIONS.map((agency) => (
                  <label
                    key={agency}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={agenciesCertifiedWith.includes(agency)}
                      onChange={() => toggleAgency(agency)}
                    />
                    {agency}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Other agency / agencies
              </label>
              <input
                value={otherAgencies}
                onChange={(e) => setOtherAgencies(e.target.value)}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="Example: Badatz, Rabbi So-and-so, local vaad"
              />
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Other Tasks Willing to Perform
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {OTHER_TASK_OPTIONS.map((task) => (
                <label
                  key={task}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={otherTasks.includes(task)}
                    onChange={() => toggleOtherTask(task)}
                  />
                  {task}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Character Reference
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  value={characterReferenceName}
                  onChange={(e) => setCharacterReferenceName(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  value={characterReferencePhone}
                  onChange={(e) => setCharacterReferencePhone(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <input
                  value={characterReferenceRelationship}
                  onChange={(e) =>
                    setCharacterReferenceRelationship(e.target.value)
                  }
                  className="w-full rounded-xl border px-4 py-3"
                  placeholder="Example: Former employer, family friend, coworker"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Rabbinic Reference
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  value={rabbinicReferenceName}
                  onChange={(e) => setRabbinicReferenceName(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  value={rabbinicReferencePhone}
                  onChange={(e) => setRabbinicReferencePhone(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  value={rabbinicReferenceTitle}
                  onChange={(e) => setRabbinicReferenceTitle(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                  placeholder="Example: Rabbi, Rav, Mashgiach supervisor"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Shul / Organization
                </label>
                <input
                  value={rabbinicReferenceOrganization}
                  onChange={(e) =>
                    setRabbinicReferenceOrganization(e.target.value)
                  }
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}