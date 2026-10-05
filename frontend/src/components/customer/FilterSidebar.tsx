"use client";

import { SlidersHorizontal, X, Check } from "lucide-react";

const MATERIALS = ["Leather", "Linen", "Velvet", "Cotton Blend", "Faux Leather", "Boucle"];
const WOOD_TYPES = ["Oak", "Walnut", "Teak", "Ash", "Acacia", "Mahogany", "Pine"];

const PRICE_RANGES = [
  { label: "Under ₹25,000", min: "", max: "25000" },
  { label: "₹25,000 - ₹50,000", min: "25000", max: "50000" },
  { label: "₹50,000 - ₹1,00,000", min: "50000", max: "100000" },
  { label: "Elite (Above ₹1,00,000)", min: "100000", max: "" },
];

const FURNITURE_CATEGORIES = [
  { name: "Sofas & Lounges", slug: "sofas" },
  { name: "Dining & Coffee Tables", slug: "tables" },
  { name: "Cabinets & Wardrobes", slug: "cabinets" },
  { name: "Accent Chairs", slug: "chairs" },
  { name: "Beds & Headboards", slug: "beds" },
];

interface FilterSidebarProps {
  selectedCategory?: string;
  selectedFabric?: string;
  selectedWood?: string;
  minPrice?: string;
  maxPrice?: string;
  onCategorySelect?: (categorySlug: string) => void;
  onFabricSelect?: (fabricName: string) => void;
  onWoodSelect?: (woodName: string) => void;
  onPriceRangeSelect?: (min: string, max: string) => void;
  onClearAll?: () => void;
  showMobileFilters?: boolean;
  onCloseMobileFilters?: () => void;
}

export default function FilterSidebar({
  selectedCategory = "",
  selectedFabric = "",
  selectedWood = "",
  minPrice = "",
  maxPrice = "",
  onCategorySelect,
  onFabricSelect,
  onWoodSelect,
  onPriceRangeSelect,
  onClearAll,
  showMobileFilters = false,
  onCloseMobileFilters,
}: FilterSidebarProps) {

  const hasActiveFilters = Boolean(selectedCategory || selectedFabric || selectedWood || minPrice || maxPrice);

  const sidebarBody = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-wood-100">
        <h3 className="font-playfair text-xl font-bold text-wood-900 flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-wood-600" /> Catalog Filters
        </h3>
        {hasActiveFilters && onClearAll && (
          <button onClick={onClearAll} className="text-xs text-wood-600 font-bold hover:text-wood-900 transition-colors uppercase tracking-wider">
            Clear All
          </button>
        )}
        {showMobileFilters && onCloseMobileFilters && (
          <button onClick={onCloseMobileFilters} aria-label="Close filters">
            <X size={20} className="text-wood-500" />
          </button>
        )}
      </div>

      {/* Category Taxonomy */}
      <div>
        <h4 className="text-[11px] font-bold text-wood-500 tracking-widest mb-3 uppercase">Category</h4>
        <div className="space-y-1.5 text-sm font-medium">
          <button
            onClick={() => onCategorySelect?.("")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${!selectedCategory ? "bg-wood-900 text-white" : "hover:bg-wood-50 text-wood-600"
              }`}
          >
            <span>All Masterpieces</span>
          </button>

          {FURNITURE_CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
            return (
              <button
                key={cat.slug}
                onClick={() => onCategorySelect?.(cat.slug)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${isCatActive ? "bg-wood-900 text-white shadow-sm" : "hover:bg-wood-50 text-wood-600"
                  }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wood Types Filter Chips */}
      <div>
        <h4 className="text-[11px] font-bold text-wood-500 tracking-widest mb-3 uppercase">Wood Species</h4>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-none pr-1">
          {WOOD_TYPES.map((wood) => {
            const isWoodActive = selectedWood.toLowerCase() === wood.toLowerCase();
            return (
              <button
                key={wood}
                onClick={() => onWoodSelect?.(wood)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${isWoodActive
                    ? "bg-wood-800 text-white border-wood-800"
                    : "bg-white text-wood-600 border-wood-200 hover:border-wood-800 hover:text-wood-800"
                  }`}
              >
                {isWoodActive && <Check size={12} />}
                {wood}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fabric / Material Filter Chips */}
      <div>
        <h4 className="text-[11px] font-bold text-wood-500 tracking-widest mb-3 uppercase">Upholstery / Material</h4>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-none pr-1">
          {MATERIALS.map((fab) => {
            const isFabActive = selectedFabric?.toLowerCase() === fab.toLowerCase();
            return (
              <button
                key={fab}
                onClick={() => onFabricSelect?.(fab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${isFabActive
                    ? "bg-wood-800 text-white border-wood-800"
                    : "bg-white text-wood-600 border-wood-200 hover:border-wood-800 hover:text-wood-800"
                  }`}
              >
                {isFabActive && <Check size={12} />}
                {fab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Ranges */}
      <div>
        <h4 className="text-[11px] font-bold text-wood-500 tracking-widest mb-3 uppercase">Price Range</h4>
        <div className="space-y-1.5 text-sm font-medium">
          {PRICE_RANGES.map((pr) => {
            const isPrActive = minPrice === pr.min && maxPrice === pr.max;
            return (
              <button
                key={pr.label}
                onClick={() => onPriceRangeSelect?.(pr.min, pr.max)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${isPrActive ? "bg-wood-900 text-white shadow-sm" : "hover:bg-wood-50 text-wood-600"
                  }`}
              >
                <span>{pr.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <aside className={`lg:block ${showMobileFilters ? "fixed inset-0 z-50 bg-black/60 flex justify-end" : "hidden"}`}>
      <div className={`${showMobileFilters ? "w-4/5 max-w-sm bg-white h-full overflow-y-auto p-6 animate-fade-left" : "bg-white border border-wood-200 rounded-2xl p-6 shadow-sm sticky top-24"}`}>
        {sidebarBody}
      </div>
    </aside>
  );
}
