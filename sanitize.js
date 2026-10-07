const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    for (const [search, replace] of replacements) {
        modified = modified.replace(new RegExp(search, 'g'), replace);
    }
    if (modified !== content) {
        fs.writeFileSync(filePath, modified);
        console.log(`Updated ${filePath}`);
    }
}

// 1. Terms 
replaceInFile('frontend/src/app/terms/page.tsx', [
    ['Silk Sarees, Bridal collections, and Fine Jewellery', 'Premium Sofas, Designer Dining Tables, and Fine Furniture'],
    ['Jewellery items cannot be returned once security tags are removed. Sarees must be returned in original, unworn foldings', 'Furniture items cannot be returned once assembly seals are broken. Smaller items must be returned in original, untouched packaging']
]);

// 2. Shipping
replaceInFile('frontend/src/app/shipping-policy/page.tsx', [
    ['Silver jewellery resizing, custom bridal sarees', 'Custom sofa upholstery, bespoke wood finishes'],
    ['Handloom Sarees: High-value designer sarees are thoroughly steam-pressed, double-checked for weaving perfection, and secured in luxury heirloom cases', 'Oversized Furniture: High-value furniture pieces are thoroughly polished, double-checked for structural perfection, and secured in heavy-duty padded transport crates']
]);

// 3. Refund
replaceInFile('frontend/src/app/refund-policy/page.tsx', [
    ['jewelry boxes, protective pouches, security tags, silk weave tags', 'protective foam, transport crates, hardware security tags, and care manuals'],
    ['perfume traces, makeup smudges, saree pleat deformations', 'stains, upholstery smudges, wood scratches, or structural deformations'],
    ['Custom jewelry sizes, custom-engraved silver products, and personalized bridal sarees', 'Custom wood dimensions, engraved furniture, and personalized upholstery selections'],
    ['Sarees with Stitching Services: Sarees ordered with pre-stitched blouses, custom falls, or tailored edgings', 'Furniture with Custom Finishes: Tables ordered with custom distressing, stains, or tailored hardware']
]);

// 4. Layout
replaceInFile('frontend/src/app/layout.tsx', [
    ['fine jewellery and hand-woven silk sarees', 'fine furniture and premium home decor']
]);

// 5. Merchant Products
replaceInFile('frontend/src/app/merchant/products/page.tsx', [
    ['Sarees", subcategory: "Kanchipuram Silk Sarees', 'Living Room", subcategory: "Luxury Sofas'],
    ['Kanchipuram Silk Saree', 'Velvet Amber Sofa'],
    ['Temple Gold Necklace', 'Walnut Coffee Table'],
    ['main_category"\) \\|\\| "Sarees"', 'main_category") || "Living Room"'],
    ['matchedMain = "Sarees"', 'matchedMain = "Living Room"']
]);

// 6. Merchant Orders
replaceInFile('frontend/src/app/merchant/orders/[id]/page.tsx', [
    ['Jewellery Product', 'Furniture Assembly']
]);

// 7. Customer Categories
replaceInFile('frontend/src/app/customer/categories/page.tsx', [
    ['category=jewellery', 'category=living-room'],
    ['category=sarees', 'category=bedroom']
]);

// 8. Contact
replaceInFile('frontend/src/app/contact/page.tsx', [
    ['Inquiry about Kanchipuram Saree', 'Inquiry about Velvet Amber Sofa']
]);

// 9. Auth Layout
replaceInFile('frontend/src/app/auth/layout.tsx', [
    ['HANDCRAFTED JEWELLERY &amp; SILK SAREES', 'PREMIUM CRAFTED FURNITURE &amp; DECOR'],
    ['HANDCRAFTED JEWELLERY & SILK SAREES', 'PREMIUM CRAFTED FURNITURE & DECOR']
]);

console.log('Sanitization complete!');
