'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '../../lib/auth'

export default function MashgiachSignup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSignup = async () => {
    const { error } = await signUp(email, password, 'mashgiach')

    if (error) {
      alert(error.message)
    } else {
      router.push('/mashgiach/profile')
    }
  }

  return (
    <div>
      <h1>Mashgiach Signup</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleSignup}>Sign Up</button>
    </div>
  )
}