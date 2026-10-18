# Razorpay Standard Checkout

The active provider is Razorpay. PhonePe routes, frontend buttons, SDK logic and environment examples have been retired. Historical payment attempts and their provider/environment remain in MongoDB for audit. Existing unfinished PhonePe sandbox attempts can be replaced with Razorpay attempts; an active legacy live transaction requires owner review first. Test payments can never be converted into live payments on the same partially-paid order.

## Render setup

Add the following backend environment variables:

RAZORPAY_KEY_ID=(your Razorpay Live Mode Key ID, starting rzp_live_)
RAZORPAY_KEY_SECRET=(the matching Live Mode Key Secret)
RAZORPAY_WEBHOOK_SECRET=(a separate strong secret you choose for the webhook)
RAZORPAY_MODE=live

Never add the key secret or webhook secret to Vercel or a NEXT_PUBLIC_ variable. The frontend obtains the public checkout key and gateway order ID from the authenticated backend. No new Vercel environment variables are required. Keep BACKEND_URL pointing to the Render backend and FRONTEND_URL matching the actual site origin. Remove the old PHONEPE_* variables from Render. Save/redeploy the backend and deploy the changed frontend together.

For local or sandbox testing, use a matching rzp_test_ key pair and RAZORPAY_MODE=test instead. The supplied test keys are saved only in the ignored local backend .env with RAZORPAY_MODE=test. The official razorpay Node SDK is installed. Automated tests use the SDK with a simulated HTTP adapter; a separate smoke check successfully created an unpaid INR 1 order against Razorpay Test Mode. No real charge has been made. Live keys have not been provided. The backend refuses to start gateway payments until valid key settings exist.

## Razorpay dashboard

1. Enable automatic payment capture. An authorized-but-not-captured payment never credits the order.
2. In Live Mode, create a webhook pointing to https://ballanki-a1-furnitures.onrender.com/api/v1/payments/razorpay/webhook .
3. Set its secret to exactly the RAZORPAY_WEBHOOK_SECRET value in Render.
4. Subscribe to payment.captured, order.paid, payment.failed and payment.authorized.
5. Ensure the store website https://www.ballankia1furnitures.in is approved for live payments and the desired domestic payment methods are enabled.

Webhook HMAC SHA256 is checked against the raw JSON body. Checkout signatures use the backend-saved Razorpay order ID and key secret. The backend then fetches order/payment details from Razorpay and verifies the INR amount, ownership and capture state. Browser callbacks and webhook payloads alone never mark payments paid. Duplicate verification and webhooks cannot credit an installment twice. Server reconciliation continues when the customer closes the page.

## Payment behavior

Ready-stock units are payable in full. Pre-booked units use the fixed 20% advance on the original or accepted negotiated price. Shipping and ready-stock amounts are included in the initial payment. Remaining balances use a separate Razorpay order for only the outstanding amount. The store order remains partially_paid until all amounts are captured. Initial payment is required for production/confirmation; full payment is required before shipping. Test payments are labelled and excluded from live revenue. EMI and Pay Later are disabled in checkout; confirm account-level methods in Razorpay too.

Failed card/UPI attempts can be retried against the same Razorpay order, without creating another chargeable gateway order. A lost order-creation response is recovered using the unique receipt before retrying. Unpaid orders with an active payable gateway order cannot be cancelled automatically because that gateway order may still receive a delayed payment; contact the owner for resolution. Automated refunds remain disabled and must be processed in the Razorpay dashboard, with the store records reconciled by the owner. Refunds and legacy gateway settlement migration are outside this replacement.

## Tests

Run npm run test:razorpay in backend. It creates and removes only a uniquely named disposable Atlas database. The official Razorpay SDK is exercised with simulated HTTP responses; no test emails are sent and no real payment is attempted. It covers full/advance/balance payments, accepted negotiated price, capture requirements, signatures, raw webhook body preservation, duplicate callbacks, ownership, tampered amounts, timeout recovery, retry reuse, fulfillment guards and exclusion of test receipts from live revenue. Run the frontend TypeScript check as well.

After configuring keys, test on the deployed website: ready-stock order, pre-booking advance, balance payment, failed payment retry, dismiss/reopen checkout, and webhook delivery. Confirm captured INR amounts in both Razorpay Dashboard and the website. A real live transaction must be completed by the owner; do not use test cards with live keys.

Official references:
https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
https://razorpay.com/docs/api/orders/create/
https://razorpay.com/docs/api/orders/fetch-all/
https://razorpay.com/docs/webhooks/validate-test/

## Existing endpoint equivalents

POST /api/v1/payments/razorpay/start accepts {order_id: STORE_ORDER_ID}, authenticates the buyer, calculates the payable amount from the saved order and creates/reuses a Razorpay order. Its response includes order_id (the Razorpay order ID), razorpay_order_id, amount (paise), currency, key_id and environment. Client-supplied amounts are intentionally not trusted. Minimum gateway amount is 100 paise; invalid amounts return 400, gateway authentication errors 401, and other gateway API errors 500. No duplicate generic endpoint is required.

POST /api/v1/payments/razorpay/verify accepts order_id (the store order ID), razorpay_order_id, razorpay_payment_id and razorpay_signature. Missing/invalid signature fields return 400 and do not credit the order. A matching HMAC proves the response, but funds are credited only after captured payment details are verified through Razorpay.

Frontend files already present: src/lib/razorpayCheckout.ts (singleton checkout script, modal, dismissal/failure handling), src/lib/api.ts (payment endpoints), src/app/customer/orders/checkout/page.tsx (checkout button), src/app/customer/orders/[id]/page.tsx (resume payment and balance collection). The public key comes from the backend, so NEXT_PUBLIC_RAZORPAY_KEY_ID is not required. KEY_SECRET never reaches the frontend.
