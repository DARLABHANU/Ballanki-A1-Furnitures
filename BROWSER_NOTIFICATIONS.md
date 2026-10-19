# Browser notifications

Browser push uses the same MongoDB notifications displayed in the bell. A persisted queue sends notifications in the background; order placement, payment processing and chat requests do not wait for the push provider.

## Deployment

1. Copy the three values from **`backend/.env.push`** into **Render → Environment**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
2. Deploy the backend and frontend. No additional Vercel environment variables are needed: the frontend retrieves only the public key from `/api/v1/push/config`.
3. Keep the private key on the backend. The local deployment file is ignored by Git. Keep the same key pair across deployments; the frontend renews subscriptions if the key pair changes and browser permission remains granted.

## Permission and testing

On opening the website, the frontend requests browser notification permission once per page load if no decision exists and push is configured. This also works before sign-in; subscriptions are bound only after authentication. Already granted or denied permission is respected. Browsers that require a direct gesture receive a small dismissible Allow notifications prompt outside the bell. The bell contains only notification status, with no enable or test buttons. Users can revoke permission in browser site settings.

To test real delivery, approve permission, sign in, and send a chat message from the other account or update an order. Use separate browser profiles for admin/customer: one browser subscription belongs to one account at a time. Permission prompts and real push delivery must be checked on the target device.

Clicking a notification opens its order, enquiry or dashboard on the same website. Lock-screen previews use generic text. The bell still works when browser push is blocked or unsupported. Logout revokes subscriptions and clears the browser owner; queued messages cannot be sent to a revoked or reassigned account.

HTTPS (or localhost for development) and browser/OS notification support are required. On iPhone/iPad, add the site to the Home Screen and open it there first. Delivery while the tab is closed depends on browser/OS background settings. See [Apple's Web Push documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).

## Implementation

- `PushSubscription`: one encrypted push endpoint per browser/device, scoped to the signed-in user and session version. Unused subscriptions expire after 90 days.
- `PushJob`: persisted, unique notification/subscription pairs; bounded retries, leases, 24-hour expiry, expired-endpoint cleanup.
- Existing unread notifications from the last 24 hours are examined. Only subscriptions enabled **before** the notification was created receive it; enabling does not broadcast historical messages.
- No fetch handler or account/API caching in the service worker. Notification links are restricted to the same origin. Browser push endpoints are restricted to recognised push providers to prevent arbitrary backend network requests.
- Backend sender uses the [web-push library](https://github.com/web-push-libs/web-push).

Checks: `node backend/tests/push.cjs`; from frontend, `node tests/notification-permission.cjs`, `node tests/browser-push.cjs`, `node tests/push-worker.cjs`, and `node node_modules/typescript/bin/tsc --noEmit`. These tests mock browser permissions, the push provider and persistence. A real-device delivery test requires the user's browser permission after deployment.
