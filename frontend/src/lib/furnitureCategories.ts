export interface FurnitureCategory {name:string;slug:string;image:string;related:string[];}
export const furnitureCategories:FurnitureCategory[] = [
  {
    "name": "All furniture",
    "slug": "",
    "image": "/images/categories/all.jpg",
    "related": [
      "sofa",
      "chair",
      "dining",
      "bed",
      "cupboard",
      "table",
      "wardrobe",
      "tv",
      "storage",
      "office",
      "recliner",
      "shoe",
      "bookshelf",
      "desk",
      "dressing",
      "mattress",
      "outdoor",
      "kids"
    ]
  },
  {
    "name": "Sofas",
    "slug": "sofa",
    "image": "/images/categories/sofa.jpg",
    "related": [
      "sofa",
      "recliner",
      "chair",
      "table",
      "tv"
    ]
  },
  {
    "name": "Chairs",
    "slug": "chair",
    "image": "/images/categories/chair.jpg",
    "related": [
      "chair",
      "office",
      "recliner",
      "dining",
      "outdoor",
      "kids"
    ]
  },
  {
    "name": "Dining",
    "slug": "dining",
    "image": "/images/categories/dining.jpg",
    "related": [
      "dining",
      "chair",
      "table",
      "cupboard",
      "storage"
    ]
  },
  {
    "name": "Beds",
    "slug": "bed",
    "image": "/images/categories/bed.jpg",
    "related": [
      "bed",
      "mattress",
      "wardrobe",
      "cupboard",
      "dressing",
      "kids"
    ]
  },
  {
    "name": "Cupboards",
    "slug": "cupboard",
    "image": "/images/categories/cupboard.jpg",
    "related": [
      "cupboard",
      "wardrobe",
      "storage",
      "bookshelf",
      "shoe"
    ]
  },
  {
    "name": "Tables",
    "slug": "table",
    "image": "/images/categories/table.jpg",
    "related": [
      "table",
      "dining",
      "desk",
      "dressing",
      "office"
    ]
  },
  {
    "name": "Wardrobes",
    "slug": "wardrobe",
    "image": "/images/categories/wardrobe.jpg",
    "related": [
      "wardrobe",
      "cupboard",
      "dressing",
      "storage",
      "bed"
    ]
  },
  {
    "name": "TV units",
    "slug": "tv",
    "image": "/images/categories/tv.jpg",
    "related": [
      "tv",
      "table",
      "storage",
      "sofa",
      "bookshelf"
    ]
  },
  {
    "name": "Storage",
    "slug": "storage",
    "image": "/images/categories/storage.jpg",
    "related": [
      "storage",
      "cupboard",
      "wardrobe",
      "shoe",
      "bookshelf"
    ]
  },
  {
    "name": "Office",
    "slug": "office",
    "image": "/images/categories/office.jpg",
    "related": [
      "office",
      "desk",
      "chair",
      "bookshelf",
      "storage"
    ]
  },
  {
    "name": "Recliners",
    "slug": "recliner",
    "image": "/images/categories/recliner.jpg",
    "related": [
      "recliner",
      "sofa",
      "chair",
      "table"
    ]
  },
  {
    "name": "Shoe racks",
    "slug": "shoe",
    "image": "/images/categories/shoe.jpg",
    "related": [
      "shoe",
      "storage",
      "cupboard"
    ]
  },
  {
    "name": "Bookshelves",
    "slug": "bookshelf",
    "image": "/images/categories/bookshelf.jpg",
    "related": [
      "bookshelf",
      "desk",
      "storage",
      "cupboard"
    ]
  },
  {
    "name": "Study desks",
    "slug": "desk",
    "image": "/images/categories/desk.jpg",
    "related": [
      "desk",
      "office",
      "chair",
      "bookshelf"
    ]
  },
  {
    "name": "Dressing tables",
    "slug": "dressing",
    "image": "/images/categories/dressing.jpg",
    "related": [
      "dressing",
      "wardrobe",
      "bed",
      "storage"
    ]
  },
  {
    "name": "Mattresses",
    "slug": "mattress",
    "image": "/images/categories/mattress.jpg",
    "related": [
      "mattress",
      "bed",
      "kids"
    ]
  },
  {
    "name": "Outdoor",
    "slug": "outdoor",
    "image": "/images/categories/outdoor.jpg",
    "related": [
      "outdoor",
      "chair",
      "table"
    ]
  },
  {
    "name": "Kids furniture",
    "slug": "kids",
    "image": "/images/categories/kids.jpg",
    "related": [
      "kids",
      "bed",
      "desk",
      "bookshelf",
      "storage"
    ]
  }
];
export function categoryBrowserHref(slug:string){return slug?`/customer/categories?category=${encodeURIComponent(slug)}`:'/customer/categories';}
export function categoryProductsHref(slug:string){return slug?`/customer/products?category=${encodeURIComponent(slug)}`:'/customer/products';}
export function findFurnitureCategory(slug:string|null){return furnitureCategories.find(c=>c.slug===(slug==='all'?'':slug||''))||furnitureCategories[0];}
