# Category management

The storefront has exactly two levels: Category -> Products. There are no customer or owner subcategory/type controls.

- Home category tiles and categories-page cards open matching products immediately.
- Old /customer/categories?category= links redirect to the category product list. Old type/subcategory links open the parent category; the customer UI clears those old filters.
- Admin -> Categories supports category names, pictures, visibility and order. Uploaded category images still use Cloudinary. Hide a category without deleting products.
- Product creation/editing requires one category. The backend accepts category-only products even when a category has no saved legacy types. Product labels use the category name.
- Existing legacy type metadata remains stored for compatibility and matching existing products. It is not a browsing level and is not deleted or shown in the editor. No production records are migrated or removed by this code change.
- Categories with solid-wood filtering retain that option. Product availability, pricing, preorder, images and payments are unchanged.

Deploy backend first, then frontend. No new environment variables. Admin saves still update home/categories/filter choices via the existing shared catalogue and refresh mechanism.

Validation: backend/tests/catalog-management.cjs uses in-memory data (no Atlas or Cloudinary writes); frontend/tests/catalog-store.cjs verifies direct product links and shared updates. Production frontend build includes TypeScript validation.
