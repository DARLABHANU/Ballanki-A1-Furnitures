# Store operations deployment

Deploy the backend to Render and frontend to Vercel together. No database reset is required. Existing order amounts, delivery prices and payment records are preserved.

## Razorpay live configuration

Render needs the actual matching live key pair in RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, with RAZORPAY_MODE set to live. Secrets remain backend-only. Vercel does not need a Razorpay secret or a new public-key variable: checkout receives the public key ID from the backend.

The private, Git-ignored backend/.env.razorpay-live contains a generated webhook secret and the live mode setting. Copy its webhook secret into Render as RAZORPAY_WEBHOOK_SECRET and use that same secret in Razorpay's webhook settings. This file does not contain the API key pair.

Configure the webhook in Razorpay Live Mode:

- URL: https://ballanki-a1-furnitures.onrender.com/api/v1/payments/razorpay/webhook
- Events: payment.captured, payment.failed, order.paid, refund.processed, refund.failed
- Secret: the same RAZORPAY_WEBHOOK_SECRET saved in Render

The public /api/v1/payments/config endpoint should report enabled=true, mode=razorpay_live and environment=production. Admin settings also show missing variables, mode mismatch and webhook readiness without exposing secrets. Configuration checks cannot prove account activation or a successful real transaction. Test and live payments cannot be mixed on one order; use a new order for live checkout.

## Branding and invoices

Admin > Website & branding controls the store name, Cloudinary logo upload or safe image URL, footer, canonical domain, SEO title/description, social image, business name/address, support contacts and invoice terms. Client branding refreshes automatically; server metadata refreshes on a 30-second cache. Public product pages have product metadata and canonical links. Sitemap, robots and the installable-app manifest are generated; private account/admin routes send noindex headers.

Enter the actual business name and full address before accepting live orders. As confirmed by the owner, Ballanki is not GST-registered. Invoices are regular sales invoices/payment summaries with no GST charged. They include invoice/order references, buyer address, products, delivery charges, preorder advance, verified payment references, refunds and outstanding balance. Unpaid orders are labelled accordingly. New orders retain a seller snapshot; legacy orders without one capture the current seller details at first download. Only the customer and authorized staff can download the PDF.

## Delivery

Admin > Platform settings > Delivery areas & pricing supports standard and per-unit fees, free-delivery thresholds and PIN-code zones. Longest-prefix matching wins. Individual zones can block delivery; delivery outside configured zones can be disabled. Existing default charges remain until the owner edits them; no new commercial prices are invented.

Checkout quotes the selected saved address on the server. It rejects unavailable areas and changes to the expected total, then snapshots the rate on the order. Product-specific making/delivery day counts remain intact.

Order details retain making, readiness, payment and dispatch actions. Owners can enter a carrier/delivery team, tracking number, safe HTTPS tracking URL, current location and customer-visible note. Updates notify customers and appear in history. Tracking is owner-managed. Automated courier booking or carrier API synchronization needs a selected courier account/integration and is not included here.

## Returns

Customers request a whole-order return after delivery. Repeated requests reuse the existing record. Admins can search/filter, approve/reject with notes, mark furniture received and initiate a full refund of verified Razorpay payments. Customers see the status history and refund references on their order page.

Refunding is an explicit admin action after receipt of the returned furniture. Stable Razorpay idempotency keys protect each advance/balance payment against duplicate refunds. Pending refunds are refreshed through signed webhooks, a background worker or the Check refund status action. Orders become refunded only after all provider refunds are processed. Gross receipts remain recorded; processed refunds reduce revenue. Failed/mismatched refunds require review and are not labelled successful. This flow supports whole-order returns, not per-item partial returns or fabricated cash-refund records.

## Validation

The production frontend build passed. Checks include 50 payment HTTP checks, 49 operations HTTP checks, invoice generation/ownership tests, environment normalization, delivery/payment schedules, chat regression and 112 admin-preservation checks. Tests use simulated gateway responses and separate disposable databases. No real charge or refund was made. A labelled PDF preview was rendered and visually inspected. Real-device checkout and notification testing remain deployment checks.

References:

- https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
- https://razorpay.com/docs/api/refunds/normal-refunds-idempotent
