'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function BillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Please log in first')
        return
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
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