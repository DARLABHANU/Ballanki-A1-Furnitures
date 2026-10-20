const assert=require('node:assert/strict');
const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');
const source=fs.readFileSync('src/lib/seo.ts','utf8');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const sandbox={exports:{},URL};vm.runInNewContext(compiled,sandbox);const {jsonLd,pageMetadata}=sandbox.exports;
const hostile={name:'</script><script>alert(1)</script>'};assert.ok(!jsonLd(hostile).includes('<'));assert.deepEqual(JSON.parse(jsonLd(hostile)),hostile);
const b={siteUrl:'https://www.ballankia1furnitures.in',siteName:'Ballanki',logoUrl:'/logo.png'};const m=pageMetadata(b,'/contact','Contact Ballanki','Real enquiries');assert.equal(m.alternates.canonical,b.siteUrl+'/contact');assert.equal(m.openGraph.url,m.alternates.canonical);assert.equal(m.openGraph.images[0].url,b.siteUrl+'/logo.png');assert.ok(!fs.readFileSync('src/app/page.tsx','utf8').startsWith('"use client"'));assert.ok(fs.readFileSync('src/app/sitemap.ts','utf8').includes('/furniture-vizag'));
console.log('PASS: JSON-LD injection protection and round trip, canonical and social URLs, server home and sitemap inclusion.');
