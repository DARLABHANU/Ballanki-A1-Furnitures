const {spawn}=require('node:child_process');const assert=require('node:assert/strict');
const port=String(32000+process.pid%1000);
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',port],{env:{...process.env,BACKEND_URL:'https://ballanki-a1-furnitures-93130244749.asia-south1.run.app'},stdio:'ignore'});
const base='http://127.0.0.1:'+port;const headers={'User-Agent':'Googlebot'};
async function get(path){const r=await fetch(base+path,{headers,redirect:'manual'});return {status:r.status,text:await r.text(),headers:r.headers};}
function schemas(html){return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));}
(async()=>{try{let ready=false;for(let i=0;i<30;i++){try{await fetch(base);ready=true;break;}catch{await new Promise(r=>setTimeout(r,500));}}assert.ok(ready,'Production server started');
const [home,local,contact,site,robots,alias,privatePage]=await Promise.all(['/', '/furniture-vizag','/contact','/sitemap.xml','/robots.txt','/contact-us','/customer/orders'].map(get));
assert.equal(home.status,200);assert.ok(/<title>Ballanki A1 Furnitures.*Anakapalle.*Vizag/.test(home.text),'Regional title');
const graph=schemas(home.text)[0]['@graph'];assert.equal(graph[0]['@type'],'FurnitureStore');assert.ok(graph[0].address.streetAddress.includes('Sirasapalli'));
assert.ok(/rel="canonical" href="https:\/\/www.ballankia1furnitures.in\/?"/.test(home.text),'Home canonical');
assert.ok(local.text.includes('Wooden furniture for homes'));assert.ok(contact.text.includes('<address'));assert.ok(contact.text.includes('Sirasapalli'));assert.equal(site.status,200,'Sitemap status');assert.ok(site.text.includes('/furniture-vizag'),'Sitemap contains local page, response: '+site.text.slice(0,120));assert.ok(robots.text.includes('Disallow: /admin/'));assert.equal(alias.status,308);assert.ok(privatePage.headers.get('x-robots-tag').includes('noindex'));
const catalogue=await (await fetch('https://ballanki-a1-furnitures-93130244749.asia-south1.run.app/api/v1/products?page_size=1')).json();assert.ok(catalogue.items.length);const p=catalogue.items[0];assert.ok(home.text.includes('/customer/products/'+p.id),'Real product links render on server');
const detail=await get('/customer/products/'+p.id);assert.equal(detail.status,200);const data=schemas(detail.text);const product=data.find(x=>x['@type']==='Product');assert.equal(product.name,p.name);assert.equal(product.offers.price,p.price);assert.equal(product.offers.priceCurrency,'INR');assert.ok(data.find(x=>x['@type']==='BreadcrumbList'));
console.log('PASS: production HTML titles, canonical URLs, confirmed address/schema, server-rendered real products, local page, contact, sitemap, robots, private noindex, redirect and product price/breadcrumb markup.');
}finally{child.kill();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
