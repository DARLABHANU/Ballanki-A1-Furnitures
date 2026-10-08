# Gmail API email setup

The backend now sends OTP, order and negotiation emails through Gmail API over HTTPS.
No domain purchase, SMTP port, Resend account or new frontend environment variable is needed.
Sender: ballankia1furnitures@gmail.com.

## 1. Create a separate Google Cloud project for email

Use https://console.cloud.google.com/ and create a project named Ballanki Email.
This keeps the email authorization separate from the existing customer Google sign-in project.

Open APIs & Services > Library, search Gmail API and click Enable.
Open Google Auth Platform and complete Branding/Audience setup:
- App name: Ballanki Email
- Support/contact email: ballankia1furnitures@gmail.com
- Audience: External
- During Testing, add ballankia1furnitures@gmail.com as a test user.
Open Data Access and add only this scope:
https://www.googleapis.com/auth/gmail.send
This grants sending permission, without permission to read your inbox.

## 2. Create Gmail OAuth credentials

Google Auth Platform > Clients > Create client:
- Application type: Web application
- Name: Ballanki Gmail Sender
- Authorized redirect URI: https://developers.google.com/oauthplayground
- No JavaScript origin is needed for this server email authorization.
Copy this new client ID and client secret privately.
Do not replace NEXT_PUBLIC_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID used for customer sign-in.

## 3. Authorize your sender and obtain a refresh token

Open https://developers.google.com/oauthplayground/
- Open the settings gear.
- Enable Use your own OAuth credentials.
- Enter the new Gmail client ID and secret.
- Set Access type to Offline if that option is shown.
- In Step 1 enter https://www.googleapis.com/auth/gmail.send and click Authorize APIs.
- Sign in specifically as ballankia1furnitures@gmail.com and approve sending permission.
- In Step 2 click Exchange authorization code for tokens.
- Copy the refresh token, not the short-lived access token.
Store the secret and refresh token only in the backend environment.

Testing-mode external OAuth projects issue refresh tokens that expire after seven days
when Gmail scopes are requested. For ongoing use, review Google Auth Platform Audience
publishing status and Verification Center requirements, publish when permitted, and generate
new authorization credentials afterward. Publishing does not exempt an app from applicable
Google verification requirements. Only the owner's mailbox needs this sending authorization.
Revoking Google access or changing some account/security settings can invalidate the token;
if authorization fails later, repeat authorization and replace GMAIL_REFRESH_TOKEN.

## 4. Add these Render backend variables

```env
GMAIL_CLIENT_ID=your-new-gmail-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-new-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
EMAIL_FROM=Ballanki A1 Furnitures <ballankia1furnitures@gmail.com>
ADMIN_NOTIFICATION_EMAIL=ballankia1furnitures@gmail.com
EMAIL_REPLY_TO=ballankia1furnitures@gmail.com
EMAIL_WEBSITE_URL=https://ballanki-a1-furnitures.vercel.app
LOCAL_EMAIL_OUTBOX=false
NODE_ENV=production
```

Delete RESEND_API_KEY from Render; it is no longer used. Keep existing database/JWT/Google
customer sign-in variables. Gmail OAuth credentials must never have a NEXT_PUBLIC prefix.
Push the code and redeploy Render. Deploy the frontend OTP changes too if not deployed yet.
No additional Vercel variables are required.

## Behavior and verification

Registration/recovery codes expire after 10 minutes, allow five attempts and are single-use.
Resend requests have a one-minute cooldown and five-per-hour limit per email and purpose.
Google customer sign-in remains separate and does not require an email OTP.
Order placement/status/cancellation alerts and negotiation messages/offers/decisions queue
emails for active verified customers and admins, with links back to the website.

Queued messages survive restarts and retry temporary failures. A stable Message-ID is included,
but Gmail API has no Resend-style idempotency key: if a request times out after Gmail accepted
it, a retry may send a duplicate. Sent status means provider acceptance, not inbox delivery.
Gmail sending quotas and anti-abuse rules apply; this is suitable for initial low-volume use.
Render free-service sleep pauses background delivery until the backend wakes. Use an always-on
service for prompt background delivery. Inbox delivery must be tested after authorization.

Development LOCAL_EMAIL_OUTBOX=true saves messages under backend/local-outbox instead of
sending email; production never uses this fallback. Email challenge/job collections use TTL
cleanup (one day/seven days). They do not replace application users or order collections.

Run npm run test:email and npm run test:gmail from backend. Provider calls are mocked; integration
tests use disposable databases and do not modify the application database or send real emails.
After setup, register with your own email, reset its password, place an order and exchange
negotiation messages with admin. Confirm receipt in the inbox and check the sender's Sent folder.

References:
https://developers.google.com/workspace/gmail/api/guides/sending
https://developers.google.com/workspace/gmail/api/auth/scopes
https://developers.google.com/identity/protocols/oauth2#expiration
