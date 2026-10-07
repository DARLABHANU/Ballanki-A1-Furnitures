const fs = require('fs');

function directReplace(filePath, searchStr, replaceStr) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = content.split(searchStr).join(replaceStr);
    if (modified !== content) {
        fs.writeFileSync(filePath, modified);
        console.log(`Updated ${filePath}`);
    }
}

// 5. Merchant Products
directReplace('frontend/src/app/merchant/products/page.tsx', 
    'main_category: "Sarees", subcategory: "Kanchipuram Silk Sarees"', 
    'main_category: "Living Room", subcategory: "Luxury Sofas"'
);
directReplace('frontend/src/app/merchant/products/page.tsx', 
    'Kanchipuram Silk Saree', 
    'Velvet Amber Sofa'
);
directReplace('frontend/src/app/merchant/products/page.tsx', 
    'Temple Gold Necklace', 
    'Walnut Coffee Table'
);
directReplace('frontend/src/app/merchant/products/page.tsx', 
    'matchedMain = "Sarees"', 
    'matchedMain = "Living Room"'
);
directReplace('frontend/src/app/merchant/products/page.tsx', 
    'watch("main_category") || "Sarees"', 
    'watch("main_category") || "Living Room"'
);

// 6. Merchant Orders
directReplace('frontend/src/app/merchant/orders/[id]/page.tsx', 'Jewellery Product', 'Furniture Assembly');

// 7. Customer Categories
directReplace('frontend/src/app/customer/categories/page.tsx', 'category=jewellery', 'category=living-room');
directReplace('frontend/src/app/customer/categories/page.tsx', 'category=sarees', 'category=bedroom');

// 8. Contact
directReplace('frontend/src/app/contact/page.tsx', 'Inquiry about Kanchipuram Saree', 'Inquiry about Velvet Amber Sofa');

// 9. Auth Layout
directReplace('frontend/src/app/auth/layout.tsx', 'HANDCRAFTED JEWELLERY &amp; SILK SAREES', 'PREMIUM CRAFTED FURNITURE &amp; DECOR');
directReplace('frontend/src/app/auth/layout.tsx', 'HANDCRAFTED JEWELLERY & SILK SAREES', 'PREMIUM CRAFTED FURNITURE & DECOR');

console.log('Final text sanitization complete!');
