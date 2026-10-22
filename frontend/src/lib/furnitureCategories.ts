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
export function categoryBrowserHref(slug:string){return slug?`/customer/products?category=${encodeURIComponent(slug)}`:'/customer/categories';}
export function categoryProductsHref(slug:string){return slug?`/customer/products?category=${encodeURIComponent(slug)}`:'/customer/products';}
export function findFurnitureCategory(slug:string|null){return furnitureCategories.find(c=>c.slug===(slug==='all'?'':slug||''))||furnitureCategories[0];}

// Browsing taxonomy informed by Andhra Pradesh catalogues; not a claim of stock or origin.
export const furnitureTypes:Record<string,string[]> = {
  "chair": [
    "Dining chairs",
    "Armchairs",
    "Armless chairs",
    "Rocking chairs",
    "Easy chairs",
    "Carved chairs",
    "Slat-back chairs",
    "Ladder-back chairs",
    "Study chairs",
    "Wooden stools"
  ],
  "sofa": [
    "Wooden sofa sets",
    "Three-seater sofas",
    "Two-seater sofas",
    "Single-seater sofas",
    "Corner sofas",
    "Carved sofa sets",
    "Diwans",
    "Sofa cum beds"
  ],
  "dining": [
    "Four-seater dining sets",
    "Six-seater dining sets",
    "Eight-seater dining sets",
    "Round dining sets",
    "Square dining sets",
    "Rectangular dining sets",
    "Dining benches",
    "Wooden-top dining tables"
  ],
  "bed": [
    "Pandiri Mancham",
    "Teak cots",
    "Single cots",
    "Double cots",
    "Queen-size beds",
    "King-size beds",
    "Storage cots",
    "Carved cots",
    "Diwan cots",
    "Bunk beds"
  ],
  "cupboard": [
    "Berwa cupboards",
    "Two-door cupboards",
    "Three-door cupboards",
    "Kitchen cupboards",
    "Crockery cupboards",
    "Pooja cupboards",
    "Carved cupboards"
  ],
  "table": [
    "Tea poys",
    "Coffee tables",
    "Side tables",
    "Bedside tables",
    "Console tables",
    "Nesting tables",
    "Centre tables"
  ],
  "wardrobe": [
    "Two-door wardrobes",
    "Three-door wardrobes",
    "Four-door wardrobes",
    "Mirror wardrobes",
    "Drawer wardrobes",
    "Carved wardrobes"
  ],
  "tv": [
    "TV consoles",
    "TV cabinets",
    "Low TV units",
    "TV units with storage",
    "TV stands"
  ],
  "storage": [
    "Wooden chests",
    "Drawer chests",
    "Sideboards",
    "Display cabinets",
    "Pooja mandirs",
    "Storage benches",
    "Blanket boxes"
  ],
  "office": [
    "Office desks",
    "Writing desks",
    "Office chairs",
    "Filing cabinets",
    "Office bookcases",
    "Meeting tables"
  ],
  "recliner": [
    "Wooden easy chairs",
    "Wooden lounge chairs",
    "Reclining wooden chairs",
    "Wooden footstools"
  ],
  "shoe": [
    "Open shoe racks",
    "Closed shoe cabinets",
    "Shoe benches",
    "Slatted shoe racks",
    "Tall shoe cabinets"
  ],
  "bookshelf": [
    "Open bookcases",
    "Glass-door bookcases",
    "Low bookshelves",
    "Tall bookshelves",
    "Corner bookshelves",
    "Wall bookshelves"
  ],
  "desk": [
    "Writing tables",
    "Study tables",
    "Study tables with drawers",
    "Study desks with shelves",
    "Computer desks"
  ],
  "dressing": [
    "Dressing tables with drawers",
    "Dressing tables with storage",
    "Standing mirror dressers",
    "Compact dressing tables",
    "Carved dressing tables"
  ],
  "outdoor": [
    "Verandah chairs",
    "Garden benches",
    "Outdoor tables",
    "Patio dining sets",
    "Wooden swings",
    "Balcony stools"
  ],
  "kids": [
    "Wooden cradles",
    "Kids beds",
    "Kids bunk beds",
    "Kids study sets",
    "Kids chairs",
    "Toy chests",
    "Kids bookshelves"
  ]
};
export function furnitureTypeHref(category:string,type:string){const q=new URLSearchParams({category,subcategory:type,construction:"solid_wood"});return `/customer/products?${q}`;}
