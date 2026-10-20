# Ballanki search visibility setup

## Code changes
- Server-rendered home product cards and visible local business copy.
- Home, catalogue, categories, contact, policy and individual product metadata with canonical URLs.
- FurnitureStore and WebSite JSON-LD on home; Product/Offer and breadcrumbs on real product pages.
- Confirmed address: Sirasapalli village, Anakapalle mandal, Anakapalle district, Andhra Pradesh, India. No invented PIN, coordinates, phone, reviews or opening hours.
- /furniture-vizag explains categories, availability, pre-order payments and location-specific delivery enquiries without promising coverage.
- Removed legacy public/sitemap.xml and public/robots.txt pointing at ratnamayuri.me that overrode generated routes in local production checks.
- Sitemap includes local information page and active public products. Private routes stay excluded from crawling/indexing.
- Contact/privacy/terms aliases redirect permanently to canonical pages.

## Deploy
Push these frontend changes and redeploy Vercel. BACKEND_URL must remain the working Google Cloud backend URL. No new dependency is required. Admin custom SEO text remains supported.

## Google Search Console (owner action)
1. Open https://search.google.com/search-console and add a Domain property: ballankia1furnitures.in.
2. Copy the exact verification TXT record supplied by Google into Hostinger DNS. Keep existing A/CNAME/email records. Do not invent a verification token.
3. Click Verify in Search Console after DNS propagation.
4. Submit https://www.ballankia1furnitures.in/sitemap.xml.
5. Inspect and request indexing for the home URL, /furniture-vizag and important real product URLs after deployment.
6. Track Page indexing and Search results. Indexing/ranking are determined by Google and are not instant or guaranteed.

Alternative: for a URL-prefix property, add the exact HTML verification token as GOOGLE_SITE_VERIFICATION in Vercel and redeploy. Code supports this optionally; do not put an entire meta tag in this value.

## Local business owner actions
Create/claim and verify the Google Business Profile for the actual Sirasapalli store. Add the same business name/address, real public phone, accurate hours, photographs and website URL. Enter verified address and support contact in Admin -> Website settings so contact and invoice information remain consistent. Never publish a fabricated Vizag branch or fake reviews. Ask genuine customers for honest reviews.

## Content maintenance
Only real products should remain published. The current public catalogue includes a product named "test 1"; archive test/demo listings in admin if they are not saleable. Use descriptive product names, truthful materials, dimensions, original photos and model descriptions. Do not label composite materials as solid wood. Confirm actual delivery coverage in the delivery policy. More useful genuine catalogue content is needed to compete for broad searches such as "furniture Vizag".

## Remaining confirmed-detail gaps
Public phone, postal PIN, opening hours, map URL and Google profile URL have not been supplied. Add verified values later; markup intentionally omits them.

## Validation completed
Production Next.js build and TypeScript passed (64 routes). node tests/seo.cjs validates JSON-LD escaping and metadata. node tests/seo-rendered.cjs starts and stops an isolated production server, verifies server-rendered HTML, store and product schemas against the public read-only API, canonicals, contact address, robots, sitemap, redirects and private noindex headers. No production records were modified.
