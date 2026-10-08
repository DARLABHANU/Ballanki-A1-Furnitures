# Google sign-in deployment

The login page includes Google's official Continue with Google button below Sign In.
New Google accounts become customers. Existing accounts must confirm their website
password once before linking Google. After linking, Google returns the same account,
orders and role. Disabled accounts remain blocked. Google-only accounts have no
website password; use Google to sign in.

## Vercel

Set the following variable in the frontend project before rebuilding:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1086302940000-u41rh4el2k8qmmmonsp90v2lssjq9v7b.apps.googleusercontent.com
```

## Render

Set the following variable in the backend service:

```env
GOOGLE_CLIENT_ID=1086302940000-u41rh4el2k8qmmmonsp90v2lssjq9v7b.apps.googleusercontent.com
```

Use the normal npm install build command, then redeploy the backend and frontend.
The Google client secret is not used and must not be placed in frontend variables.
Keep FRONTEND_URL configured to the exact production frontend origin.

## Google Cloud

In Google Auth Platform > Clients > this Web application, authorize these JavaScript origins:

```text
https://ballanki-a1-furnitures.vercel.app
http://localhost
http://localhost:3000
http://127.0.0.1:3000
```

No redirect URI is required: the Google popup returns a credential to a JavaScript
callback, which sends it to POST /api/v1/auth/google for server verification.
Configure branding and audience; publish the app for customer access when ready.
Preview Vercel deployments require their own exact authorized origins if used.

## Verification

From backend, run npm run test:google. It verifies real Google-library signature
and token claims against local test certificates, then exercises real HTTP routes,
JWT sessions and MongoDB using a disposable ballanki_google_test_* database.
Only the identity provider is mocked for the HTTP lifecycle checks. The test drops
its own database on completion and never changes the configured application database.

After deployment, manually test Google sign-in with an actual Google account on
the production website; OAuth console settings and the live popup cannot be
confirmed by automated backend tests. Test an existing password account's one-time
linking as well as a new customer account.
