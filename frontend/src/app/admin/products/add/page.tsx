"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Image as ImageIcon, Save, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function AdminAddProductPage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(true);
  const [editError, setEditError] = useState("");
  const [catalog, setCatalog] = useState<{id:string;name:string}[]>([]);
  const [details, setDetails] = useState({ warranty_text: "", specifications: "", variant_ids: [] as string[], bundle_ids: [] as string[] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploadLock = useRef(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    description: "",
    sku: "",
    price: "",
    compare_price: "",
    stock_quantity: "1",
    low_stock_threshold: "2",
    main_category: "Living Room",
    subcategory: "",
    allow_pre_order: true,
    expected_delivery_date: "",
    material: "",
    wood_type: "",
    dimensions: "",
    fulfillment_type: "READY_STOCK",
    manufacturing_duration_days: "",
    shipping_duration_days: "5",
    is_active: true,
    is_featured: false
  });

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("id");
    setEditingId(editId);
    api.get("/products/merchant/my-products", { params: { limit: 100 } }).then(({data}) => setCatalog((data.items || []).map((p:any)=>({id:String(p.id),name:p.name})))).catch(()=>{});
    if (!editId) { setLoadingEdit(false); return; }
    api.get(`/products/${editId}/manage`).then(({data:p}) => {
      setFormData(previous => Object.fromEntries(Object.entries(previous).map(([key,value]) => [key, typeof value === "boolean" ? Boolean(p[key]) : p[key] == null ? "" : key === "expected_delivery_date" ? String(p[key]).slice(0,10) : key === "dimensions" && typeof p[key] === "object" ? [p[key].length,p[key].width,p[key].height].filter(v=>v!=null).join(" × ")+" "+(p[key].unit||"") : String(p[key])])) as typeof previous);
      setImages(p.images || []);
      setDetails({warranty_text:p.warranty_text || "", specifications:Object.entries(p.attributes || {}).map(([key,value])=>`${key}: ${value}`).join("\n"), variant_ids:(p.variant_ids||[]).map(String), bundle_ids:(p.bundle_ids||[]).map(String)});
    }).catch(()=>setEditError("Could not load this product. Return to the product list and try again.")).finally(()=>setLoadingEdit(false));
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim() || isUploading || isSubmitting) return;
    if (images.length >= 5) { toast.error("Maximum 5 pictures per product."); return; }
    try { const url = new URL(imageUrlInput.trim()); if (url.protocol !== "https:") throw new Error(); }
    catch { toast.error("Enter a valid HTTPS image URL."); return; }
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput("");
  };

  const handleUploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || uploadLock.current || isSubmitting) return;
    if (files.length + images.length > 5) { toast.error(`You can add ${5 - images.length} more picture(s).`); return; }
    if (files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024)) {
      toast.error("Choose JPEG, PNG or WebP pictures, up to 3 MB each."); return;
    }
    uploadLock.current = true;
    setIsUploading(true);
    let uploaded = 0;
    try {
      for (const file of files) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read the selected picture."));
          reader.readAsDataURL(file);
        });
        const response = await api.post("/upload", { filename: file.name, base64 });
        setImages(previous => [...previous, response.data.url]);
        uploaded++;
      }
      toast.success(`${uploaded} picture(s) uploaded.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error.message || "Picture upload failed. Please retry.");
    } finally { uploadLock.current = false; setIsUploading(false); }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadLock.current || isSubmitting) return;
    if (images.length === 0 || images.length > 5) {
      toast.error("Please add between 1 and 5 product pictures.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        warranty_text: details.warranty_text,
        attributes: Object.fromEntries(details.specifications.split("\n").filter(line=>line.includes(":")).map(line=>{const [key,...value]=line.split(":");return [key.trim(),value.join(":").trim()];})),
        variant_ids: details.variant_ids,
        bundle_ids: details.bundle_ids,
        price: Number(formData.price),
        compare_price: formData.compare_price ? Number(formData.compare_price) : 0,
        stock_quantity: Number(formData.stock_quantity),
        low_stock_threshold: Number(formData.low_stock_threshold),
        manufacturing_duration_days: formData.manufacturing_duration_days ? Number(formData.manufacturing_duration_days) : undefined,
        shipping_duration_days: formData.shipping_duration_days ? Number(formData.shipping_duration_days) : undefined,
        images
      };

      if(editingId) await api.put(`/products/${editingId}`, payload);
      else await api.post("/products", payload);
      toast.success(editingId ? "Product updated" : "Product published");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error adding product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if(loadingEdit) return <p role="status" className="p-8">Loading product form…</p>;
  if(editError) return <p className="p-8 text-red-600">{editError}</p>;
  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#EFEBE3] pb-4">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white transition-colors border border-transparent hover:border-[#E2DAC8]"
        >
          <ArrowLeft size={18} className="text-[#666666]" />
        </button>
        <div>
          <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">{editingId ? "Edit Product" : "Create New Product"}</h1>
          <p className="text-xs text-[#808080]">List a new furniture item directly to the storefront</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2DAC8] rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-2">Basic Information</h3>
            
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Product Title / Name *</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]" placeholder="e.g. Velvet Amber Sofa" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Category *</label>
                <select name="main_category" value={formData.main_category} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-[#0D0D0D]">
                  <option value="Living Room">Living Room</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Dining Room">Dining Room</option>
                  <option value="Home Office">Home Office</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">SKU Code</label>
                <input name="sku" value={formData.sku} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#0D0D0D]" placeholder="e.g. VAS-001" />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Short Description *</label>
              <textarea required name="short_description" value={formData.short_description} onChange={handleChange} rows={2} className="w-full bg-white border border-[#E2DAC8] rounded-xl p-3 text-xs focus:outline-none focus:border-[#0D0D0D] resize-none" placeholder="Brief summary for product card..." />
            </div>
          </div>

          <div className="bg-white border border-[#E2DAC8] rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-2">Furniture Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Primary Material</label>
                <input name="material" value={formData.material} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#0D0D0D]" placeholder="e.g. Velvet, Stainless Steel" />
              </div>
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Wood Type</label>
                <input name="wood_type" value={formData.wood_type} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#0D0D0D]" placeholder="e.g. Solid Teak, Walnut" />
              </div>
              <div className="md:col-span-2">
                <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Dimensions</label>
                <input name="dimensions" value={formData.dimensions} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#0D0D0D]" placeholder="e.g. 84`W x 36`D x 34`H" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Pricing & Images) */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E2DAC8] rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-2">Pricing & Logistics</h3>
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Base Price (₹) *</label>
              <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]" placeholder="0" />
            </div>
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Compare Price (₹)</label>
              <input type="number" name="compare_price" value={formData.compare_price} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#0D0D0D]" placeholder="Optional MSRP" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Stock</label>
                <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#0D0D0D]" />
              </div>
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Type</label>
                <select name="fulfillment_type" value={formData.fulfillment_type} onChange={handleChange} className="w-full bg-white border border-[#E2DAC8] rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-[#0D0D0D]">
                  <option value="READY_STOCK">In Stock</option>
                  <option value="MADE_TO_ORDER">Custom Built</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2DAC8] rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-2">Product Images ({images.length}/5)</h3>
            <fieldset disabled={isUploading || isSubmitting} className="space-y-4 disabled:opacity-60">
            <div>
              <label htmlFor="product-pictures" className="block text-xs font-bold mb-2">Upload from your device</label>
              <input id="product-pictures" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={images.length >= 5 || isUploading || isSubmitting} onChange={handleUploadImages} className="block min-w-0 w-full max-w-full text-xs" />
              <p className="text-xs text-gray-500 mt-2">Up to 5 pictures. JPEG, PNG or WebP, maximum 3 MB each. The first picture is the cover.</p>
            </div>
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1 text-xs">Add Image URL</label>
              <div className="flex gap-2">
                <input value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} className="min-w-0 flex-1 bg-white border border-[#E2DAC8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0D0D0D]" placeholder="https://..." />
                <button type="button" disabled={images.length >= 5} onClick={handleAddImage} className="bg-[#0D0D0D] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#333333] transition-colors"><ImageIcon size={14} /></button>
              </div>
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#E2DAC8] aspect-square">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            </fieldset>
            {isUploading && <p role="status" className="text-xs flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Uploading pictures...</p>}
          </div>
        </div>

        <section className="col-span-1 space-y-4 rounded-2xl border bg-white p-5 lg:col-span-3">
          <h2 className="font-inter text-base font-semibold">Product page details</h2>
          <label className="block text-xs font-semibold">Full product description<textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="mt-2 block w-full rounded-lg border p-3 font-normal"/></label>
          <label className="block text-xs font-semibold">Furniture type<input name="subcategory" value={formData.subcategory} onChange={handleChange} className="mt-2 block w-full rounded-lg border p-3 font-normal" placeholder="Sofa, chair, dining table, cupboard…"/></label>
          <label className="block text-xs font-semibold">Expected delivery date<input required type="date" name="expected_delivery_date" value={formData.expected_delivery_date} onChange={handleChange} className="mt-2 block w-full rounded-lg border p-3"/></label><p className="text-xs leading-5">Available stock is sold first. Additional quantities are pre-booked with a fixed 20% advance on the listed or accepted negotiated price. Payment collection must be enabled separately.</p>
          <p className="text-xs text-slate-500">Only enter verified details. Linked options and room combinations use actual product prices.</p>
          <label className="block text-xs font-semibold">Warranty & service details<textarea value={details.warranty_text} maxLength={2000} onChange={e=>setDetails(d=>({...d,warranty_text:e.target.value}))} rows={3} className="mt-2 block w-full rounded-lg border p-3 font-normal" placeholder="Enter the actual warranty and service terms, if applicable"/></label>
          <label className="block text-xs font-semibold">Additional specifications<textarea value={details.specifications} onChange={e=>setDetails(d=>({...d,specifications:e.target.value}))} rows={4} className="mt-2 block w-full rounded-lg border p-3 font-normal" placeholder={"Colour: Walnut\nAssembly: Required\nCare: Wipe with a dry cloth"}/></label>
          <p className="text-[11px] text-slate-500">One specification per line, in Name: Value format. Maximum 30.</p>
          <div className="grid gap-5 sm:grid-cols-2">{(["variant_ids","bundle_ids"] as const).map(key=><label key={key} className="text-xs font-semibold">{key==="variant_ids"?"Other colours / sizes (linked products)":"Complete the room (linked products)"}<select multiple value={details[key]} onChange={e=>setDetails(d=>({...d,[key]:Array.from(e.target.selectedOptions,option=>option.value)}))} className="mt-2 block h-36 w-full rounded-lg border p-2 font-normal">{catalog.filter(p=>p.id!==editingId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><span className="mt-1 block text-[10px] font-normal text-slate-500">Hold Ctrl / Command to select multiple. Up to 12 items. Only public products appear to customers.</span></label>)}</div>
          {editingId&&<a href={`/customer/products/${editingId}`} className="inline-block text-xs underline">Preview product and answer customer questions ↗</a>}
        </section>
        {/* Action Bar */}
        <div className="col-span-1 lg:col-span-3 bg-white border border-[#E2DAC8] rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#1A1A1A]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="accent-[#0D0D0D] w-4 h-4" />
              Publicly Visible
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} className="accent-[#0D0D0D] w-4 h-4" />
              Featured Product
            </label>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || isUploading}
            className="flex w-full sm:w-auto justify-center items-center gap-2 bg-[#0D0D0D] hover:bg-[#333333] text-white px-8 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Publish Furniture"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
