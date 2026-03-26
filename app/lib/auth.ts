import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
}

export async function requireBusinessUser() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: roleRow, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !roleRow || roleRow.role !== 'business') {
    redirect('/mashgiach/dashboard')
  }

  return { supabase, user }
}

export async function ensureBusinessProfile(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { data: profile, error } = await supabase
    .from('business_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (profile) {
    return profile
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from('business_profiles')
    .insert({
      user_id: userId,
    })
    .select('user_id')
    .single()

  if (insertError) {
    throw insertError
  }

  return createdProfile
}

export async function requireMashgiachUser() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: roleRow, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !roleRow || roleRow.role !== 'mashgiach') {
    redirect('/business/dashboard')
  }

  return { supabase, user }
}
