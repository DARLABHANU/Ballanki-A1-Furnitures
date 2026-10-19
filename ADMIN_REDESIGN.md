# Responsive admin redesign

The admin workspace uses white surfaces, forest-green actions, a pale green-grey canvas, consistent Inter typography and larger touch controls. Storefront styles are unaffected.

## Navigation

All original destinations remain available: overview, users, promoters, products, categories/types, orders, customer chats, coupons/offers, reports, returns/disputes, platform settings, marketing, website branding, support desk, storefront and sign out. Retired merchant/settlement routes retain their existing redirects.

Desktop navigation is grouped into Store, Customers & growth, and Manage. Phones have Home, Orders, Products, Chats and More. More opens a native modal drawer with focus trapping, Escape dismissal, scroll locking and focus restoration. A working page finder searches page names and task descriptions, supports keyboard selection and correctly distinguishes Users from Promoters.

## Page changes

- Overview: useful store shortcuts, readable metrics and charts, with existing live data, time filters, recent orders, top products, status counts and shortcuts preserved.
- Products, orders, users, coupons and returns: the same records render as desktop tables and labelled phone cards. Original action handlers, controls and form fields are preserved, with clearer mobile action labels and larger touch targets.
- Product editor and settings: improved form spacing, reachable sticky save bars, visible touch-screen image removal and consistent controls. Image upload limits, Cloudinary integration, per-product delivery days, variants, bundles, specifications and visibility controls remain intact.
- Categories: horizontal category selection on phones, keeping names, ordering, type images, uploads, hide/show and save controls.
- Chats: phone inbox and conversation views with a back control; wide screens show both. Messages, timestamps, offers, replies, accept/decline and refresh remain available.
- Order details: responsive payment summary, printing and all making/readiness/payment/dispatch controls retained.
- Reports, marketing and branding retain their existing tools and behavior. Previously unavailable backend capabilities remain unavailable; this design change does not simulate success.

## Small usability fixes

Product management now uses the existing authenticated admin catalog API so hidden/unapproved products remain manageable. Product search is connected, filters reset pagination and a failed load offers Retry. Order records use the API's customer field. Coupon search filters records and pagination operates on the loaded results, replacing static numbered buttons. Missing coupon dates are no longer fabricated.

## Validation

Production Next.js build passed, including 61 generated routes. TypeScript and 112 checks passed: source inventory confirms original form fields, handlers/API capabilities and destinations remain; React rendering verifies shared mobile labels/content, preserved callable actions, empty states and accessibility attributes. CSS parses, responsive breakpoints and print rules are present. No live data was edited by these checks. Authenticated browser visual testing on real phones was not performed in this task.

## Design references

- Shopify Polaris tables: https://polaris-react.shopify.com/components/tables
- IBM Carbon data-table guidance: https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines

Deploy the frontend to Vercel to publish the redesign. No new environment variables or backend changes are required.
