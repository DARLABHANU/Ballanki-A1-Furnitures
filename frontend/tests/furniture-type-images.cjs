const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function load(file){const result={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:result,URLSearchParams});return result;}
const {furnitureTypeImage}=load('src/lib/furnitureTypeImages.ts');const {furnitureTypes}=load('src/lib/furnitureCategories.ts');
const sources=JSON.parse(fs.readFileSync('public/images/furniture-types/sources.json','utf8'));let checked=0;
for(const[category,types]of Object.entries(furnitureTypes)){
 const images=[];
 for(const type of types){const image=furnitureTypeImage(category,type);if(!image)continue;assert.ok(!images.includes(image),`Repeated photo in ${category}: ${type}`);images.push(image);assert.equal(sources[`${category}:${type}`].image,image);const bytes=fs.readFileSync(path.join('public',image));assert.equal(bytes.readUInt16BE(0),0xffd8,`Invalid JPEG: ${image}`);assert.ok(bytes.length>1000);checked++;}
}
for(const type of furnitureTypes.chair)assert.ok(furnitureTypeImage('chair',type),`Missing chair type photo: ${type}`);
assert.equal(furnitureTypeImage('chair','No such chair'),undefined);assert.equal(furnitureTypeImage('','Dining chairs'),undefined);
assert.equal(checked,Object.keys(sources).length);console.log(`${checked} source records and local type photos verified; all 10 chair types have different photos; missing types have no category fallback.`);
