import Stripe from 'stripe'
import { headers } from 'next/headers'
import { stripe } from '@/app/lib/stripe'
import { supabase } from '@/app/lib/supabase'

export async function POST(req: Request) {
  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const userId = session.metadata?.userId

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id

        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id

        if (!userId) {
          console.error('Missing userId in checkout.session.completed metadata')
          break
        }

        let subscriptionStatus = 'active'
        let currentPeriodEnd: string | null = null

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          subscriptionStatus = subscription.status

          const periodEndUnix =
            'current_period_end' in subscription &&
            typeof subscription.current_period_end === 'number'
              ? subscription.current_period_end
              : null

          currentPeriodEnd = periodEndUnix
            ? new Date(periodEndUnix * 1000).toISOString()
            : null
        }

        const { error } = await supabase
          .from('business_profiles')
          .update({
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId ?? null,
            subscription_status: subscriptionStatus,
            current_period_end: currentPeriodEnd,
            unlock_credits: 20,
          })
          .eq('user_id', userId)

        if (error) {
          console.error(
            'Failed updating business_profiles on checkout completion:',
            error
          )
          return new Response('Database update failed', { status: 500 })
        }

        console.log('checkout.session.completed handled for user:', userId)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null
        }

        const subscriptionValue = invoice.subscription

        const subscriptionId =
          typeof subscriptionValue === 'string'
            ? subscriptionValue
            : subscriptionValue?.id

        if (!subscriptionId) {
          console.log('invoice.paid with no subscription id')
          break
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        const periodEndUnix =
          'current_period_end' in subscription &&
          typeof subscription.current_period_end === 'number'
            ? subscription.current_period_end
            : null

        const { error } = await supabase
          .from('business_profiles')
          .update({
            subscription_status: subscription.status,
            current_period_end: periodEndUnix
              ? new Date(periodEndUnix * 1000).toISOString()
              : null,
            unlock_credits: 20,
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) {
          console.error('Failed updating business_profiles on invoice.paid:', error)
          return new Response('Database update failed', { status: 500 })
        }

        console.log('invoice.paid handled for subscription:', subscriptionId)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const periodEndUnix =
          'current_period_end' in subscription &&
          typeof subscription.current_period_end === 'number'
            ? subscription.current_period_end
            : null

        const { error } = await supabase
          .from('business_profiles')
          .update({
            subscription_status: subscription.status,
            current_period_end: periodEndUnix
              ? new Date(periodEndUnix * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error(
            'Failed updating business_profiles on subscription change:',
            error
          )
          return new Response('Database update failed', { status: 500 })
        }

        console.log(`${event.type} handled for subscription:`, subscription.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
        break
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response('Webhook handler failed', { status: 500 })
  }
}