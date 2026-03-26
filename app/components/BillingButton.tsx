'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function BillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    try {
      setLoading(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        alert('Please log in first')
        return
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Something went wrong')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error(error)
      alert('Unable to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Subscribe for $100/month'}
    </button>
  )
}
