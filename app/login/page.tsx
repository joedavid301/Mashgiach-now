'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setMessage('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Login succeeded, but could not load user.')
      setLoading(false)
      return
    }

    const { data: userRow, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (roleError || !userRow) {
      setMessage('Logged in, but could not load account role.')
      setLoading(false)
      return
    }

    if (userRow.role === 'business') {
      router.push('/dashboard')
      router.refresh()
      return
    }

    if (userRow.role === 'mashgiach') {
      router.push('/mashgiach/dashboard')
      router.refresh()
      return
    }

    setMessage('Unknown account role.')
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <br />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </button>

      <br />
      <br />
      {message && <p>{message}</p>}
    </div>
  )
}