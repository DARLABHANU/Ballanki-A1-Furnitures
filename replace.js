const fs = require('fs');
const file = 'frontend/src/app/admin/products/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/const \{ getMockProducts \} = await import\("@\/lib\/mockData"\);[\s\S]*?const \{ items, total, pages \} = getMockProducts\(\{\}\);/m, 
const { productApi } = require('@/lib/api');
      const response = await productApi.list({});
      const { items, total, pages } = response.data;);

fs.writeFileSync(file, data);
