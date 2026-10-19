// Locally hosted design reference photos. Provenance: public/images/furniture-types/sources.json.
// Missing entries intentionally have no generic category-photo substitution.
const typeImages:Record<string,Record<string,string>> = {
  "chair": {
    "Dining chairs": "/images/furniture-types/19093861.jpg",
    "Armchairs": "/images/furniture-types/11112742.jpg",
    "Armless chairs": "/images/furniture-types/11112728.jpg",
    "Rocking chairs": "/images/furniture-types/4627516.jpg",
    "Easy chairs": "/images/furniture-types/39712613.jpg",
    "Carved chairs": "/images/furniture-types/8135249.jpg",
    "Slat-back chairs": "/images/furniture-types/14700400.jpg",
    "Ladder-back chairs": "/images/furniture-types/11112732.jpg",
    "Study chairs": "/images/furniture-types/4769492.jpg",
    "Wooden stools": "/images/furniture-types/36085626.jpg"
  },
  "sofa": {
    "Wooden sofa sets": "/images/furniture-types/26821694.jpg",
    "Single-seater sofas": "/images/furniture-types/8123130.jpg"
  },
  "dining": {
    "Four-seater dining sets": "/images/furniture-types/271647.jpg",
    "Round dining sets": "/images/furniture-types/5677020.jpg",
    "Dining benches": "/images/furniture-types/4044789.jpg"
  },
  "bed": {
    "Pandiri Mancham": "/images/furniture-types/12715595.jpg",
    "Single cots": "/images/furniture-types/19878532.jpg",
    "Double cots": "/images/furniture-types/5502218.jpg",
    "Carved cots": "/images/furniture-types/29627918.jpg",
    "Bunk beds": "/images/furniture-types/12870114.jpg"
  },
  "cupboard": {
    "Berwa cupboards": "/images/furniture-types/19962637.jpg",
    "Kitchen cupboards": "/images/furniture-types/18038117.jpg",
    "Crockery cupboards": "/images/furniture-types/271682.jpg"
  },
  "wardrobe": {
    "Carved wardrobes": "/images/furniture-types/19962637.jpg",
    "Three-door wardrobes": "/images/furniture-types/2708106.jpg"
  },
  "table": {
    "Tea poys": "/images/furniture-types/12635891.jpg",
    "Coffee tables": "/images/furniture-types/1444424.jpg",
    "Bedside tables": "/images/furniture-types/4440215.jpg",
    "Console tables": "/images/furniture-types/8135270.jpg"
  },
  "tv": {
    "TV consoles": "/images/furniture-types/31338029.jpg",
    "TV cabinets": "/images/furniture-types/6585620.jpg"
  },
  "storage": {
    "Wooden chests": "/images/furniture-types/6370036.jpg",
    "Drawer chests": "/images/furniture-types/5825540.jpg",
    "Sideboards": "/images/furniture-types/34984437.jpg",
    "Display cabinets": "/images/furniture-types/271682.jpg"
  },
  "office": {
    "Office desks": "/images/furniture-types/5393443.jpg",
    "Writing desks": "/images/furniture-types/4769492.jpg",
    "Office bookcases": "/images/furniture-types/2883049.jpg"
  },
  "recliner": {
    "Wooden easy chairs": "/images/furniture-types/39712613.jpg",
    "Wooden footstools": "/images/furniture-types/6611422.jpg",
    "Wooden lounge chairs": "/images/furniture-types/11112742.jpg"
  },
  "shoe": {
    "Open shoe racks": "/images/furniture-types/35549708.jpg"
  },
  "bookshelf": {
    "Open bookcases": "/images/furniture-types/2883049.jpg",
    "Low bookshelves": "/images/furniture-types/31338030.jpg",
    "Tall bookshelves": "/images/furniture-types/763135.jpg"
  },
  "desk": {
    "Writing tables": "/images/furniture-types/5393443.jpg",
    "Study tables": "/images/furniture-types/4769492.jpg"
  },
  "dressing": {
    "Dressing tables with drawers": "/images/furniture-types/6873890.jpg",
    "Dressing tables with storage": "/images/furniture-types/6903253.jpg",
    "Standing mirror dressers": "/images/furniture-types/4986116.jpg"
  },
  "outdoor": {
    "Verandah chairs": "/images/furniture-types/14700400.jpg",
    "Garden benches": "/images/furniture-types/289445.jpg",
    "Wooden swings": "/images/furniture-types/31959789.jpg",
    "Balcony stools": "/images/furniture-types/36085626.jpg"
  },
  "kids": {
    "Kids bunk beds": "/images/furniture-types/12870114.jpg",
    "Kids study sets": "/images/furniture-types/30798684.jpg"
  }
};
export function furnitureTypeImage(category:string,type:string):string|undefined {return typeImages[category]?.[type];}
