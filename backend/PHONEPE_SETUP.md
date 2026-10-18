# PhonePe Standard Checkout V2

Backend integrates OAuth client credentials, hosted redirect checkout, authenticated SHA webhooks, server-to-server order-status verification, and a persistent reconciliation worker. No new frontend environment variables are required. PhonePe secrets must never use NEXT_PUBLIC_ prefixes.

## Render variables

PHONEPE_ENV=sandbox
PHONEPE_CLIENT_ID=(sandbox client ID)
PHONEPE_CLIENT_SECRET=(sandbox client secret)
PHONEPE_CLIENT_VERSION=1
PHONEPE_REDIRECT_ORIGIN=https://www.ballankia1furnitures.in
PHONEPE_WEBHOOK_USERNAME=(choose a private username)
PHONEPE_WEBHOOK_PASSWORD=(choose a long random password)

Version 1 was accepted by the supplied sandbox credentials in the authorization smoke test. Local backend .env contains the supplied test credentials and localhost redirect; it is ignored by Git. Add the values separately in Render, and use the public frontend origin there.

## Dashboard webhook

Set URL to https://ballanki-a1-furnitures.onrender.com/api/v1/payments/phonepe/webhook . Choose SHA authentication and configure the same username/password as the backend variables. Subscribe to checkout.order.completed and checkout.order.failed. Configure it in the sandbox environment. The handler checks SHA256(username:password) and then obtains payment status directly from PhonePe; browser redirects and webhook payloads alone never mark orders paid. Localhost cannot receive public webhooks. Status polling on returns and the backend reconciliation worker also verify pending attempts.

## Checkout behavior

Ready stock is charged in full. Made-to-order quantities use the server-calculated 20% advance on the listed or accepted negotiated price. Ready items and shipping are included in the initial amount. Coupons reduce the remaining balance first. Pre-booking orders become partially_paid after verification, and a second checkout collects only the remaining balance. Shipping is blocked until full payment. Confirmation/production require the initial payment. Amounts below PhonePe's INR 1 minimum require store assistance. An active or paid payment prevents unsafe cancellation and stock restoration. Sandbox orders are clearly labelled and excluded from actual payment revenue.

## Test

Run npm run test:phonepe in backend. The test uses a disposable, uniquely named Atlas database and a mocked PhonePe HTTP service; it deletes only that test database on exit. It covers successful full/advance/balance payments, duplicate webhooks, ownership, amount tampering, failed payments, concurrent starts, cancellation, fulfillment guards and timeout recovery. It does not make real payments or send test emails.

On localhost: sign in as a customer, add furniture to cart, select an address, and choose Place order & pay with PhonePe. Complete payment using PhonePe sandbox options and check the verified amount on return. Test both ready-stock and out-of-stock/pre-booked products. Initial status must not be marked paid merely because a redirect occurs. Click Check payment status if the return is delayed.

Live sandbox smoke checks separately verified OAuth authorization and created an unpaid INR 1 checkout session with a PENDING status. This proves connectivity and initiation; it does not prove completion of a payment on PhonePe's hosted test page.

## Limits

Automatic refunds are not implemented. Paid-order cancellation must not restore stock without a refund workflow. Test credentials cannot collect real money. Production requires an approved PhonePe account, new production credentials, PHONEPE_ENV=production, the HTTPS redirect origin, a production webhook and a separately verified live payment. Switching environments does not reconcile old sandbox attempts against production APIs.

Sources: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/authorization and the create-payment, order-status and webhook API references in the same directory.
