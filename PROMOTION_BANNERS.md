# Homepage promotion banners

Admin -> Promotion banners (/admin/promotions).

The carousel appears between the homepage categories rail and Fresh recommendations on mobile and desktop. It starts with a permanent, evergreen Ballanki banner, not a fabricated discount. Admin can replace that image and destination but cannot hide or remove the permanent banner. Seasonal banners can be added, removed, hidden and reordered. A maximum of 12 banners includes the permanent one.

Upload landscape JPEG/PNG/WebP images, maximum 3 MB. Recommended size: 1440 x 480 (3:1). Keep important text large enough for phones. Images are contained without cropping. Choose an optional internal destination such as /customer/products?category=chair. Uploaded assets are stored in the existing Cloudinary account under ballanki/promotions; no new keys or services.

Save changes to publish. Open storefront tabs refresh banners within 30 seconds and when returning to the page. Failed refreshes retain the last successful banners; a built-in permanent banner is available before configuration and when the API is unavailable.

Carousel: 5-second auto advance for multiple banners, arrows/dots, mobile swipes, pause/resume, pause on focus/hover and while the page is hidden. Auto advance respects prefers-reduced-motion. Single banners display without unnecessary controls. Removing an active seasonal banner selects the first remaining banner.

Backend uses the existing Setting model, key homepage:promotions, with optimistic revision checks to prevent overwriting another owner's edits. Public read never seeds the database. Admin authorization is enforced on read/write/upload routes. Backend validates permanent presence/visibility, URL safety, unique IDs, counts and image destinations. Cloudinary upload results include dimensions; portrait uploads are rejected. No production data was edited during implementation.

Deploy backend first, then frontend. No environment changes are needed. The permanent default is frontend/public/images/banners/ballanki-evergreen.svg. Removing a banner removes it from the carousel, not from Cloudinary storage, so assets are not irreversibly destroyed.

Checks: node backend/tests/promotions.cjs (28 cases; database/provider mocked); node backend/tests/catalog-cloudinary.cjs; frontend production build and TypeScript.
