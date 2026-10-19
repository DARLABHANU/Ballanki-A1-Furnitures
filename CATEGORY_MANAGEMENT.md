# Category management

Open **Admin → Categories & Types** (`/admin/categories`).

The browsing hierarchy is **Category → Type → Products**, for example **Chairs → Rocking chairs → matching products**. The product form requires an available category and one of its types. Stable category/type IDs are stored on products; legacy products still match through their existing type values.

- Add or rename categories and types, upload JPEG/PNG/WebP pictures up to 3 MB, or paste HTTPS image URLs.
- Use the arrows to change the display order. Uncheck **Show** to hide an item without deleting products.
- Click **Save changes** to publish. Home, category browsing, navigation and product filters use the same saved catalogue.
- Existing open pages refresh within 30 seconds, or when the user returns to the tab. New page visits fetch the current version.
- The product form includes **Storefront category** and furniture type choices from this catalogue. Assign new products there.
- Renaming changes display labels while preserving internal category IDs and type matching values, so existing product links keep working.
- A stale save receives a conflict message. Reload the saved version before making further changes.

Deploy the backend and frontend together (backend first). No new environment variables are required. Uploads use the existing Cloudinary settings and the `ballanki/categories` (category images), `ballanki/category-types` (type images), and `ballanki/products` (product images) folders.

The existing categories, types and reference photographs are the initial defaults. The first admin save stores the catalogue in the existing MongoDB `Setting` model under `storefront:categories`. Future deployments do not replace a saved catalogue. There is no production data seeding or product deletion.

Verification: `node backend/tests/catalog-management.cjs`; from `frontend`, `node tests/catalog-store.cjs`, `node tests/catalog-retry.cjs`, and `node node_modules/typescript/bin/tsc --noEmit`. API tests substitute the database in memory and never write to Atlas or Cloudinary.
