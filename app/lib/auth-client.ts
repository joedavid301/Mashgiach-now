import { supabase } from './supabase'

export async function signUp(
  email: string,
  password: string,
  role: 'mashgiach' | 'business'
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { data: null, error }
  }

  if (!data.user) {
    return { data: null, error: { message: 'No user returned from signup' } }
  }

  const { error: dbError } = await supabase.from('users').insert({
    id: data.user.id,
    email: data.user.email,
    role,
  })

  if (dbError) {
    return { data, error: dbError }
  }

  return { data, error: null }
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}