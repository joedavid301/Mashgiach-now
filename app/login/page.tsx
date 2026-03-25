'use client'

import { useState } from 'react'
import { signIn } from '../lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setMessage('')

    const { error } = await signIn(email, password)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Login successful')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin}>Log In</button>

      <br /><br />
      {message && <p>{message}</p>}
    </div>
  )
}