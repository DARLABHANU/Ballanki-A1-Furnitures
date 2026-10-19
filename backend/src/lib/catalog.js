const {Setting}=require('../models/Commerce');
const defaults=require('../data/catalogDefaults.json');
const {fail}=require('./http');
const KEY='storefront:categories';
const text=(value,label,max=80)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail(400,`${label} must contain 1–${max} characters`);return value.trim();};
const identifier=value=>{if(typeof value!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(value)||value==='all')fail(400,'Invalid category or type identifier');return value;};
function image(value){
 if(value===''||value==null)return '';
 if(typeof value!=='string'||value.length>2000)fail(400,'Invalid image URL');
 if(/^\/images\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$/.test(value))return value;
 try{const u=new URL(value);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch{}
 fail(400,'Images must use HTTPS or an existing local image path');
}
function validate(categories){
 if(!Array.isArray(categories)||categories.length>60)fail(400,'Provide at most 60 categories');
 const ids=new Set(),names=new Set();
 return categories.map(c=>{
  if(!c||typeof c!=='object')fail(400,'Invalid category');
  const id=identifier(c.id),name=text(c.name,'Category name');
  if(ids.has(id)||names.has(name.toLowerCase()))fail(400,'Category names and identifiers must be unique');ids.add(id);names.add(name.toLowerCase());
  if(typeof c.active!=='boolean'||typeof c.solidWoodOnly!=='boolean'||!Array.isArray(c.types)||c.types.length>80)fail(400,'Invalid category options (maximum 80 types)');
  const typeIds=new Set(),typeNames=new Set(),values=new Set();
  const types=c.types.map(t=>{
   if(!t||typeof t!=='object')fail(400,'Invalid furniture type');
   const typeId=identifier(t.id),typeName=text(t.name,'Type name'),value=text(t.value,'Type matching value');
   if(typeIds.has(typeId)||typeNames.has(typeName.toLowerCase())||values.has(value.toLowerCase())||typeof t.active!=='boolean')fail(400,'Types must have unique names, identifiers and matching values within a category');
   typeIds.add(typeId);typeNames.add(typeName.toLowerCase());values.add(value.toLowerCase());
   return {id:typeId,name:typeName,value,image:image(t.image),active:t.active};
  });
  return {id,name,image:image(c.image),active:c.active,solidWoodOnly:c.solidWoodOnly,types};
 });
}
async function readCatalog(){const setting=await Setting.findOne({key:KEY});return setting?.value||{revision:0,categories:defaults};}
function publicCatalog(catalog){return {...catalog,categories:catalog.categories.filter(c=>c.active).map(c=>({...c,types:c.types.filter(t=>t.active)}))};}
async function saveCatalog(revision,categories){
 if(!Number.isInteger(revision)||revision<0)fail(400,'Invalid catalog revision');
 const normalized=validate(categories),current=await readCatalog();
 if(current.revision!==revision)fail(409,'Categories changed in another session. Reload before saving.');
 // Matching values stay stable when labels change, so existing products remain linked.
 for(const category of normalized){const old=current.categories.find(c=>c.id===category.id);if(!old)continue;for(const type of category.types){const previous=old.types.find(t=>t.id===type.id);if(previous&&previous.value!==type.value)fail(400,'Existing type matching values cannot change. Rename the display name instead.');}}
 const value={revision:revision+1,categories:normalized};
 if(revision===0){try{await Setting.create({key:KEY,value});}catch(error){if(error.code===11000)fail(409,'Categories changed in another session. Reload before saving.');throw error;}}
 else if(!await Setting.findOneAndUpdate({key:KEY,'value.revision':revision},{$set:{value}},{new:true}))fail(409,'Categories changed in another session. Reload before saving.');
 return value;
}
async function productAssignment(body,existing){
 if(body.catalog_category_id===undefined&&body.catalog_type_id===undefined)return {};
 const catalog=await readCatalog();
 const category=catalog.categories.find(c=>c.id===body.catalog_category_id&&c.active);
 const type=category?.types.find(t=>t.id===body.catalog_type_id&&t.active);
 if(!category||!type)fail(400,'Select an available category, then a type belonging to that category');
 const categoryIds=new Set(catalog.categories.map(c=>c.id));
 const original=body.tags===undefined?(existing?.tags||[]):typeof body.tags==='string'?body.tags.split(','):body.tags;
 if(!Array.isArray(original)||original.some(tag=>typeof tag!=='string'))fail(400,'Provide valid product tags');
 return {catalog_category_id:category.id,catalog_type_id:type.id,subcategory:type.value,tags:[...new Set([...original.filter(tag=>!categoryIds.has(tag)),category.id])]};
}
module.exports={readCatalog,publicCatalog,saveCatalog,validate,productAssignment};
