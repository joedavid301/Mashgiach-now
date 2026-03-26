import { NextResponse } from 'next/server'
import { stripe } from '@/app/lib/stripe'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body?.userId as string | undefined

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: businessProfile, error } = await supabaseAdmin
      .from('business_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Portal business profile lookup error:', error)
      return NextResponse.json(
        { error: 'Failed to load business profile' },
        { status: 500 }
      )
    }

    if (!businessProfile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Stripe customer not found' },
        { status: 404 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: businessProfile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/business/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}