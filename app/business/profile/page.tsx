'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

type BusinessProfileRow = {
  user_id: string
  business_name: string | null
  contact_name: string | null
  phone: string | null
  city: string | null
}

export default function BusinessProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setMessage(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setMessage('Could not load your account.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .select('user_id, business_name, contact_name, phone, city')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      if (data) {
        const profile = data as BusinessProfileRow
        setBusinessName(profile.business_name || '')
        setContactName(profile.contact_name || '')
        setPhone(profile.phone || '')
        setCity(profile.city || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Could not load your account.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('business_profiles')
      .upsert({
        user_id: user.id,
        business_name: businessName.trim() || null,
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
      }, { onConflict: 'user_id' })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Business profile saved successfully.')
    setSaving(false)
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading business profile...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update your business details for billing and account visibility.
        </p>

        {message && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
              placeholder="BHI Catering"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Contact Name
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
              placeholder="Yossi Davidov"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
              placeholder="718-555-5555"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
              placeholder="Brooklyn"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
