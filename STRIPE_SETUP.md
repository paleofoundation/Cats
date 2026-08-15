# Stripe deployment setup

The website uses Stripe-hosted Checkout. Card details never pass through this repository or the Gardens website.

## 1. Add Vercel environment variables

In the Vercel project, add these variables:

- `STRIPE_SECRET_KEY`: the Gardens Stripe secret key (`sk_test_...` while testing, then `sk_live_...` for production)
- `STRIPE_WEBHOOK_SECRET`: the signing secret Stripe provides after the webhook is created (`whsec_...`)
- `SITE_URL`: `https://catgardens.org` in production

Scope live keys to Production only. Use separate test-mode values for Preview and Development. Never paste secret values into GitHub, HTML, or chat.

## 2. Create the Stripe webhook

In Stripe Workbench, create an event destination with this endpoint:

`https://catgardens.org/api/stripe-webhook`

Subscribe to:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted`

Copy its signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy.

## 3. Test before enabling live mode

1. Deploy with Stripe test-mode secrets.
2. Make a one-time donation using Stripe's successful test card `4242 4242 4242 4242`, any future expiry, and any CVC.
3. Make a monthly donation and confirm a test subscription was created.
4. Confirm both payments appear in Stripe and the `checkout.session.completed` webhook shows a successful `200` response.
5. Confirm cancellation returns to checkout and no payment is created.
6. Replace only the Production variables with live-mode secrets, redeploy, and make a small real donation.

Stripe Dashboard receipt emails should be enabled for successful payments. Stripe is the payment and subscription system of record; the existing `portal.html` is a static mock-up and is intentionally not used as a billing portal.
