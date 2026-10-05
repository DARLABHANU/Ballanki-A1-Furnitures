const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'frontend/src/lib/mockData.ts');
let content = fs.readFileSync(target, 'utf8');

content = content.replace(/original_price:/g, 'compare_price:');

fs.writeFileSync(target, content, 'utf8');
