"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight, Sparkles, Filter } from "lucide-react";
import { ProductListResponse } from "@/types";
import ProductCard from "@/components/customer/ProductCard";
import FilterSidebar from "@/components/customer/FilterSidebar";
import { productApi } from "@/lib/api";

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest Arrivals" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "rating_avg:desc", label: "Highest Rated" },
  { value: "total_sold:desc", label: "Best Selling" },
];

const CATEGORY_STORY_PILLS = [
  { id: "all", name: "All Collections", query: {} },
  { id: "sofas", name: "Sofas & Lounges", query: { category: "sofas" } },
  { id: "tables", name: "Dining & Coffee Tables", query: { category: "tables" } },
  { id: "chairs", name: "Accent Chairs", query: { category: "chairs" } },
  { id: "beds", name: "Beds & Headboards", query: { category: "beds" } },
  { id: "oak", name: "Solid Oak", query: { wood_type: "oak" } },
  { id: "walnut", name: "Premium Walnut", query: { wood_type: "walnut" } },
  { id: "leather", name: "Leather Upholstery", query: { fabric: "leather" } },
];

function ProductsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [search, setSearch] = useState(params.get("search") || "");
  const [sort, setSort] = useState("created_at:desc");
  const [minPrice, setMinPrice] = useState(params.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") || "");

  // Furniture specific filters
  const [selectedFabric, setSelectedFabric] = useState(params.get("fabric") || "");
  const [selectedWood, setSelectedWood] = useState(params.get("wood_type") || "");

  const [minRating, setMinRating] = useState(params.get("min_rating") || "");
  const [page, setPage] = useState(1);

  const categoryParam = params.get("category");
  const subcategoryParam = params.get("subcategory");
  const searchParam = params.get("search");
  const fabricParam = params.get("fabric");
  const woodParam = params.get("wood_type");

  const fetchProducts = async (currentPage = page) => {
    setIsLoading(true);
    const [sort_by, sort_order] = sort.split(":");

    try {
      const res = await productApi.list({
        page: currentPage,
        search: search || undefined,
        sort_by,
        sort_order,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        category: categoryParam || undefined,
        fabric: selectedFabric || undefined,
        wood_type: selectedWood || undefined,
        min_rating: minRating || undefined
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page, sort, minPrice, maxPrice, selectedFabric, selectedWood, minRating, categoryParam, subcategoryParam, searchParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1);
  };

  const applyFabricFilter = (fab: string) => {
    setSelectedFabric(selectedFabric.toLowerCase() === fab.toLowerCase() ? "" : fab);
    setPage(1);
  };

  const applyWoodFilter = (wood: string) => {
    setSelectedWood(selectedWood.toLowerCase() === wood.toLowerCase() ? "" : wood);
    setPage(1);
  };

  const applyPriceRange = (min: string, max: string) => {
    if (minPrice === min && maxPrice === max) {
      setMinPrice(""); setMaxPrice("");
    } else {
      setMinPrice(min); setMaxPrice(max);
    }
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedFabric("");
    setSelectedWood("");
    setMinRating("");
    setPage(1);
    router.push("/customer/products");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-wood-900 font-inter px-0 sm:px-2 md:px-0 py-3 sm:py-6">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-wood-200 pb-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-wood-600 bg-wood-200 border border-wood-300 px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            FURNITURE CATALOG
          </span>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-wood-900 mt-1">
            {subcategoryParam ? subcategoryParam : categoryParam ? categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1) : "Discover Masterpieces"}
          </h1>
          <p className="text-sm text-wood-600 mt-2 max-w-2xl">
            Explore authentic handcrafted sofas, robust dining tables, and luxurious bedroom furniture built to elevate your sanctuary.
          </p>
        </div>
      </div>

      {/* Horizontal Story Category Pills */}
      <div className="flex gap-2 min-w-0 max-w-full overflow-x-auto pb-3 pt-1 scrollbar-none">
        {CATEGORY_STORY_PILLS.map((pill) => {
          let isActive = false;
          if (pill.id === "all") {
            isActive = !categoryParam && !selectedFabric && !selectedWood;
          } else {
            if (pill.query.category) isActive = categoryParam === pill.query.category;
            if (pill.query.fabric) isActive = selectedFabric.toLowerCase() === pill.query.fabric.toLowerCase();
            if (pill.query.wood_type) isActive = selectedWood.toLowerCase() === pill.query.wood_type.toLowerCase();
          }

          return (
            <button
              key={pill.id}
              onClick={() => {
                if (pill.id === "all") clearAllFilters();
                else {
                  if (pill.query.fabric) applyFabricFilter(pill.query.fabric);
                  if (pill.query.wood_type) applyWoodFilter(pill.query.wood_type);
                  if (pill.query.category) router.push(`/customer/products?category=${pill.query.category}`);
                }
              }}
              className={`px-4 py-2 rounded font-semibold whitespace-nowrap transition-all flex items-center gap-2 border text-[13px] ${isActive
                ? "bg-wood-900 text-white border-wood-900 shadow-sm"
                : "bg-white text-wood-600 border-wood-200 hover:border-wood-900 hover:text-wood-900"
                }`}
            >
              {pill.id === "all" ? <Sparkles size={14} className="text-amber-500" /> : null}
              {pill.name}
            </button>
          );
        })}
      </div>

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="w-full sm:w-96 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wood-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sofas, beds, oak woods..."
            className="w-full bg-wood-50 border border-wood-200 rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-wood-900 focus:outline-none focus:border-wood-900 transition-colors shadow-sm"
          />
        </form>

        <div className="flex gap-3 w-full sm:w-auto items-center">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-white border border-wood-200 text-sm font-medium text-wood-900 px-4 py-3 rounded-lg focus:outline-none focus:border-wood-900 shadow-sm flex-1 sm:w-56 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden inline-flex items-center gap-2 bg-wood-900 text-white px-5 py-3 rounded-lg text-sm font-bold shadow-md transition-all"
          >
            <Filter size={15} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* We will update FilterSidebar visually too, passing it our new parameters */}
        <FilterSidebar
          selectedCategory={categoryParam || ""}
          selectedFabric={selectedFabric}
          selectedWood={selectedWood}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onCategorySelect={(slug) => {
            if (!slug) router.push("/customer/products");
            else router.push(`/customer/products?category=${slug}`);
            setPage(1);
          }}
          onFabricSelect={applyFabricFilter}
          onWoodSelect={applyWoodFilter}
          onPriceRangeSelect={applyPriceRange}
          onClearAll={clearAllFilters}
          showMobileFilters={showMobileFilters}
          onCloseMobileFilters={() => setShowMobileFilters(false)}
        />

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-6">

          {/* Active Filter Chips */}
          {(selectedFabric || selectedWood || minPrice || maxPrice || search || minRating) && (
            <div className="flex flex-wrap gap-2 items-center bg-wood-50 p-4 rounded-xl border border-wood-100">
              <span className="text-[11px] font-bold tracking-wider text-wood-500 uppercase mr-1">Active Filters:</span>

              {selectedWood && (
                <span className="bg-wood-800 text-wood-50 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  Type: {selectedWood} <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedWood("")} />
                </span>
              )}
              {selectedFabric && (
                <span className="bg-wood-800 text-wood-50 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  Material: {selectedFabric} <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedFabric("")} />
                </span>
              )}
              {search && (
                <span className="bg-wood-800 text-wood-50 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  &ldquo;{search}&rdquo; <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSearch("")} />
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="bg-wood-800 text-wood-50 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  ₹{minPrice || "0"} - ₹{maxPrice || "Max"} <X size={12} className="cursor-pointer hover:text-white" onClick={() => { setMinPrice(""); setMaxPrice(""); }} />
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-red-600 font-bold hover:underline ml-auto bg-red-50 px-3 py-1.5 rounded-full">Clear All</button>
            </div>
          )}

          {/* Results count */}
          {data && (
            <p className="text-sm font-medium text-wood-500">
              Showing <strong className="text-wood-900">{(data.items || []).length}</strong> meticulously crafted pieces
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-white border border-wood-100 rounded-xl p-4">
                  <div className="aspect-[4/3] bg-wood-50 rounded-lg mb-4" />
                  <div className="h-4 bg-wood-50 rounded mb-3 w-3/4" />
                  <div className="h-4 bg-wood-50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : data?.items?.length === 0 ? (
            <div className="text-center py-20 bg-white border border-wood-200 rounded-2xl p-8 shadow-sm">
              <p className="font-playfair text-3xl text-wood-900 mb-3 font-bold">No Pieces Found</p>
              <p className="text-sm text-wood-500 mb-8 max-w-md mx-auto">We couldn't find any furniture matching your exact specifications. Try broadening your materials, price limits, or categories.</p>
              <button onClick={clearAllFilters} className="border-2 border-wood-900 text-wood-900 hover:bg-wood-900 hover:text-white px-8 py-3 rounded-lg text-sm font-bold transition-all shadow-sm">Clear All Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-7">
              {data?.items?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><span className="text-sm text-wood-500 font-bold loading-pulse">CURATING CATALOG...</span></div>}>
      <ProductsContent />
    </Suspense>
  );
}
