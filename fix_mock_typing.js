const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'frontend/src/lib/mockData.ts');
let content = fs.readFileSync(target, 'utf8');

// Fix category
content = content.replace(/description: "",\s*image_url: "",\s*parent_id: null,\s*is_active: true/g, '');

// Fix merchant
content = content.replace(/merchant_id: 1,\s*business_name:/g, 'business_name:');
content = content.replace(/slug: "oak-and-heritage-studio",\s*contact_phone: "",\s*contact_email: "",\s*logo_url: "",\s*rating_avg: 5/g, 'logo_url: ""');

// Clean up trailing commas in Category
content = content.replace(/slug: "sofas",\s*},/g, 'slug: "sofas" },');
content = content.replace(/slug: "tables",\s*},/g, 'slug: "tables" },');
content = content.replace(/slug: "chairs",\s*},/g, 'slug: "chairs" },');
content = content.replace(/slug: "beds",\s*},/g, 'slug: "beds" },');

fs.writeFileSync(target, content, 'utf8');
