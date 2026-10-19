# Negotiated preorder workflow

Accepted prices are private to the customer and apply once within seven days. Product details and chat display the agreed price. Chat offers Add to cart and Buy now / Pre-book now, then links to the resulting order.

Pre-booked units require a 20% advance; ready stock and delivery charges are payable initially. For INR 50,000 of pre-booked furniture, the advance is INR 10,000 and the furniture balance INR 40,000. Checkout separately shows delivery charges.

After verified advance payment, admin opens Orders > Order details > Start making / processing > Made and ready - notify customer. This records readiness and triggers the existing customer notification/email/push system. Browser push requires permission and configured VAPID keys. The customer can now pay the balance from order details. Backend rejects earlier balance payments and blocks dispatch before full verified payment. The customer can download an updated payment-summary PDF.

Deploy frontend and backend together. No new environment variables. Existing unpaid preorder balances stay locked until admin confirms readiness. Verified payments are preserved.

Validation: 50 HTTP integration checks with simulated Razorpay responses and a separate disposable database, seven payment-schedule checks, chat regressions, and TypeScript. Real browser checkout, email delivery and native push require deployed testing.
