import { Product } from "@/types";

export const MOCK_PRODUCTS: Product[] = [
    {
        id: 101,
        name: "The Montecito Velvet Sofa",
        slug: "montecito-velvet-sofa",
        description: "Handcrafted with a kiln-dried hardwood frame and enveloped in premium crushed velvet. Sink into high-resiliency foam cushions that promise deep relaxation.",
        price: 85000,
        compare_price: 110000,
        category_id: 1,
        merchant_id: 1,
        images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800"],
        stock_quantity: 10,
        is_active: true,
        is_approved: true,
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating_avg: 4.8,
        rating_count: 12,
        total_sold: 45,
        low_stock_threshold: 5,
        material: "Velvet",
        wood_type: "Oak",
        dimensions: { length: 84, width: 38, height: 34, unit: "in" },
        fulfillment_type: "MADE_TO_ORDER",
        allow_pre_order: true,
        manufacturing_duration_days: 14,
        shipping_duration_days: 5,
        deposit_policy: {
            is_required: true,
            deposit_type: "PERCENTAGE",
            deposit_value: 30
        },
        provisional_estimate: {
            production_start_date: new Date().toISOString(),
            estimated_completion_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            estimated_delivery_date: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
            total_days: 19
        },
        category: {
            id: 1,
            name: "Sofas",
            slug: "sofas" },
        merchant: {
            id: 1,
            business_name: "Ballanki A1 Furnitures Studio",
            logo_url: ""
        }
    },
    {
        id: 102,
        name: "Lumina Solid Teak Dining Table",
        slug: "lumina-teak-dining-table",
        description: "An elegant centerpiece for your dining room. Crafted from solid reclaimed teak wood featuring natural grain patterns and a live edge finish.",
        price: 125000,
        compare_price: 140000,
        category_id: 2,
        merchant_id: 1,
        images: ["https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&q=80&w=800"],
        stock_quantity: 5,
        is_active: true,
        is_approved: true,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating_avg: 4.9,
        rating_count: 8,
        total_sold: 21,
        low_stock_threshold: 2,
        material: "None",
        wood_type: "Teak",
        dimensions: { length: 72, width: 36, height: 30, unit: "in" },
        fulfillment_type: "READY_STOCK",
        allow_pre_order: false,
        shipping_duration_days: 7,
        category: {
            id: 2,
            name: "Dining Tables",
            slug: "tables" },
        merchant: {
            id: 1,
            business_name: "Ballanki A1 Furnitures Studio",
            logo_url: ""
        }
    },
    {
        id: 103,
        name: "Heritage Leather Accent Chair",
        slug: "heritage-leather-accent-chair",
        description: "Mid-century modern design featuring full-grain Italian leather, sloped arms, and a solid walnut base. Perfect for a cozy reading nook.",
        price: 45000,
        compare_price: 52000,
        category_id: 3,
        merchant_id: 1,
        images: ["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=800"],
        stock_quantity: 0,
        is_active: true,
        is_approved: true,
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating_avg: 4.5,
        rating_count: 24,
        total_sold: 89,
        low_stock_threshold: 5,
        material: "Leather",
        wood_type: "Walnut",
        dimensions: { length: 30, width: 32, height: 36, unit: "in" },
        fulfillment_type: "MADE_TO_ORDER",
        allow_pre_order: true,
        manufacturing_duration_days: 21,
        shipping_duration_days: 4,
        deposit_policy: {
            is_required: true,
            deposit_type: "FIXED",
            deposit_value: 10000
        },
        category: {
            id: 3,
            name: "Chairs",
            slug: "chairs" },
        merchant: {
            id: 1,
            business_name: "Ballanki A1 Furnitures Studio",
            logo_url: ""
        }
    },
    {
        id: 104,
        name: "Serenity King Size Platform Bed",
        slug: "serenity-king-bed",
        description: "Minimalist platform bed featuring a tailored linen headboard and a sturdy ash wood frame. No box spring required.",
        price: 95000,
        category_id: 4,
        merchant_id: 1,
        images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800"],
        stock_quantity: 3,
        is_active: true,
        is_approved: true,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating_avg: 5.0,
        rating_count: 6,
        total_sold: 14,
        low_stock_threshold: 2,
        material: "Linen",
        wood_type: "Ash",
        dimensions: { length: 84, width: 80, height: 42, unit: "in" },
        fulfillment_type: "READY_STOCK",
        allow_pre_order: true,
        shipping_duration_days: 10,
        category: {
            id: 4,
            name: "Beds",
            slug: "beds" },
        merchant: {
            id: 1,
            business_name: "Ballanki A1 Furnitures Studio",
            logo_url: ""
        }
    },
    {
        id: 105,
        name: "Aura Minimalist Coffee Table",
        slug: "aura-coffee-table",
        description: "A gorgeous centerpiece with a tempered glass top and an abstract carved oak wood base. Perfect for modern living rooms.",
        price: 28000,
        compare_price: 34000,
        category_id: 2,
        merchant_id: 1,
        images: ["https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=800"],
        stock_quantity: 15,
        is_active: true,
        is_approved: true,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating_avg: 4.3,
        rating_count: 19,
        total_sold: 102,
        low_stock_threshold: 5,
        material: "Glass",
        wood_type: "Oak",
        dimensions: { length: 40, width: 40, height: 16, unit: "in" },
        fulfillment_type: "READY_STOCK",
        allow_pre_order: false,
        shipping_duration_days: 5,
        category: {
            id: 2,
            name: "Tables",
            slug: "tables" },
        merchant: {
            id: 1,
            business_name: "Ballanki A1 Furnitures Studio",
            logo_url: ""
        }
    },
    {
        id: 106,
        name: "Classic Chesterfield Loveseat",
        slug: "classic-chesterfield-loveseat",
        description: "Deep button-tufted upholstery, rolled arms, and nailhead trim. Wrapped in premium faux-leather over an Acacia wood frame.",
        price: 68000,
        category_id: 1,
        merchant_id: 1,
        images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800", "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=800"],
        stock_quantity: 0,
        is_active: true,
        is_approved: true,
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating_avg: 4.7,
        rating_count: 11,
        total_sold: 34,
        low_stock_threshold: 2,
        material: "Faux Leather",
        wood_type: "Acacia",
        dimensions: { length: 62, width: 34, height: 30, unit: "in" },
        fulfillment_type: "MADE_TO_ORDER",
        allow_pre_order: true,
        manufacturing_duration_days: 12,
        shipping_duration_days: 7,
        deposit_policy: {
            is_required: true,
            deposit_type: "PERCENTAGE",
            deposit_value: 50
        },
        category: {
            id: 1,
            name: "Sofas",
            slug: "sofas" },
        merchant: {
            id: 1,
            business_name: "Ballanki A1 Furnitures Studio",
            logo_url: ""
        }
    }
];

export function getMockProducts(params: any) {
    let results = [...MOCK_PRODUCTS];

    if (params.search) {
        const q = params.search.toLowerCase();
        results = results.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }

    if (params.category) {
        results = results.filter(p => p.category?.slug === params.category);
    }

    if (params.wood_type) {
        results = results.filter(p => p.wood_type?.toLowerCase() === params.wood_type.toLowerCase());
    }

    if (params.fabric) {
        results = results.filter(p => p.material?.toLowerCase() === params.fabric.toLowerCase());
    }

    if (params.min_price) {
        results = results.filter(p => p.price >= parseInt(params.min_price));
    }

    if (params.max_price) {
        results = results.filter(p => p.price <= parseInt(params.max_price));
    }

    // Sort
    if (params.sort_by === "price") {
        results.sort((a, b) => params.sort_order === "asc" ? a.price - b.price : b.price - a.price);
    } else if (params.sort_by === "total_sold") {
        results.sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0));
    } else if (params.sort_by === "rating_avg") {
        results.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    }

    return {
        items: results,
        total: results.length,
        pages: 1,
        page: 1,
        page_size: 16
    };
}

export function getMockProductById(id: number) {
    return MOCK_PRODUCTS.find(p => p.id === id) || null;
}
