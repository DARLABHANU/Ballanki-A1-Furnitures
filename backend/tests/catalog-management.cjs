const assert=require('node:assert/strict');
process.env.JWT_SECRET='catalog-test-only-secret-not-used-in-production-12345678';
const express=require('express'),jwt=require('jsonwebtoken');
const {Setting}=require('../src/models/Commerce'),User=require('../src/models/User'),Product=require('../src/models/Product');
let stored=null,reads=0,captured;
Setting.findOne=async()=>{reads++;return stored?structuredClone(stored):null;};
Setting.create=async data=>{if(stored)throw Object.assign(new Error('duplicate'),{code:11000});stored=structuredClone(data);return stored;};
Setting.findOneAndUpdate=async(filter,update)=>{if(!stored||stored.value.revision!==filter['value.revision'])return null;stored.value=structuredClone(update.$set.value);return stored;};
User.findById=async id=>({_id:id,role:id==='admin'?'admin':'customer',is_active:true,token_version:0});
Product.find=filter=>{captured=filter;return {sort(){return this},skip(){return this},limit:async()=>[]};};Product.countDocuments=async()=>0;Product.create=async body=>body;
const app=express();app.use(express.json());app.use('/api/v1',require('../src/routes/catalogRoutes'));app.use('/api/v1/products',require('../src/routes/productRoutes'));
app.use((e,req,res,next)=>res.status(e.status||500).json({error:e.message}));
let checks=0;const check=(value,message)=>{assert.ok(value,message);checks++;};
const token=role=>jwt.sign({user_id:role,version:0,type:'access'},process.env.JWT_SECRET,{expiresIn:'1m'});
const server=app.listen(0,'127.0.0.1',async()=>{
 const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 async function request(path,method='GET',body,role){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(role?{Authorization:'Bearer '+token(role)}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
 try{
  let r=await request('/catalog');check(r.status===200,'public read');check(r.data.revision===0,'default revision');check(stored===null,'reading does not write defaults');check(r.data.categories.some(c=>c.id==='chair'&&c.types.length===10),'existing defaults retained');
  check((await request('/admin/catalog')).status===401,'anonymous admin read denied');check((await request('/admin/catalog','GET',null,'customer')).status===403,'customer admin read denied');
  check((await request('/admin/catalog','PUT',{revision:0,categories:[]},'customer')).status===403,'customer write denied');
  const initial=(await request('/admin/catalog','GET',null,'admin')).data;
  const cats=structuredClone(initial.categories),chair=cats.find(c=>c.id==='chair');chair.name='Handcrafted Chairs';chair.image='https://res.cloudinary.com/example/image/upload/chairs.jpg';chair.types[0].name='Dining seat designs';chair.types[0].image='https://res.cloudinary.com/example/image/upload/dining.jpg';chair.types[1].active=false;cats.find(c=>c.id==='sofa').active=false;
  cats.unshift({id:'custom-category',name:'Custom furniture',image:'',active:true,solidWoodOnly:true,types:[{id:'custom-model',name:'Custom wooden model',value:'Custom wooden model',image:'',active:true}]});
  cats.push({id:'direct-category',name:'Direct products',image:'',active:true,solidWoodOnly:false,types:[]});
  r=await request('/admin/catalog','PUT',{revision:0,categories:cats},'admin');check(r.status===200,'save');check(r.data.revision===1,'revision increment');
  r=await request('/catalog');check(r.data.categories[0].id==='custom-category','saved order');const publicChair=r.data.categories.find(c=>c.id==='chair');check(publicChair.name==='Handcrafted Chairs','renamed category reflected');check(publicChair.image===chair.image,'saved category image');check(publicChair.types[0].name==='Dining seat designs','renamed type reflected');check(publicChair.types[0].value==='Dining chairs','matching value preserved');check(publicChair.types[0].image===chair.types[0].image,'saved type image');check(!publicChair.types.some(t=>t.id===chair.types[1].id),'hidden type excluded');check(!r.data.categories.some(c=>c.id==='sofa'),'hidden category excluded');
  r=await request('/admin/catalog','GET',null,'admin');check(r.data.categories.some(c=>c.id==='sofa'),'hidden category retained for admin');
  check((await request('/admin/catalog','PUT',{revision:0,categories:cats},'admin')).status===409,'stale save rejected');
  for(const change of [c=>c.push(c[0]),c=>{c[0].image='javascript:alert(1)';},c=>{c[0].name='';},c=>{c[0].types[0].value='Changed link';},c=>{c[0].types.push(c[0].types[0]);}]){const invalid=structuredClone(cats);change(invalid);check((await request('/admin/catalog','PUT',{revision:1,categories:invalid},'admin')).status===400,'invalid catalogue rejected');}
  await request('/products?category=chair&subcategory=Dining%20chairs&construction=solid_wood');check(captured['attributes.construction']==='solid_wood','solid wood filter retained');check(JSON.stringify(captured).includes('Dining chairs'),'renamed category matches existing product types');
  await request('/products?category=custom-category');check(JSON.stringify(captured).includes('custom-category'),'custom category matches product tag');
  check((await request('/admin/catalog/image','POST',{base64:'invalid'},'admin')).status===400,'invalid upload rejected before provider call');check((await request('/admin/catalog/image','POST',{base64:'invalid'},'customer')).status===403,'customer upload denied');
  const product={name:'Test hierarchy',price:100,delivery_duration_days:7,catalog_category_id:'chair',catalog_type_id:chair.types[0].id,tags:['custom-category','handmade']};
  r=await request('/products','POST',product,'admin');check(r.status===201,'product assigned to category and type');check(r.data.catalog_category_id==='chair'&&r.data.catalog_type_id===chair.types[0].id,'stable references saved');check(r.data.subcategory==='Dining chairs','matching value resolved by backend');check(r.data.tags.includes('chair')&&r.data.tags.includes('handmade')&&!r.data.tags.includes('custom-category'),'category tags normalized');
  r=await request('/products','POST',{...product,catalog_type_id:'custom-model'},'admin');check(r.status===400,'type from another category rejected');
  r=await request('/products','POST',{...product,catalog_type_id:chair.types[1].id},'admin');check(r.status===400,'hidden type assignment rejected');
  r=await request('/products','POST',{...product,catalog_type_id:''},'admin');check(r.status===201,'category without type accepted');check(r.data.catalog_type_id===''&&r.data.subcategory==='','no subtype stored for category-only products');
  r=await request('/products','POST',{...product,catalog_category_id:'direct-category',catalog_type_id:''},'admin');check(r.status===201&&r.data.main_category==='Direct products','new category with no types accepts products');
  r=await request('/products?category=chair&type='+chair.types[0].id);check(r.status===200,'type product page query');check(captured.$and[1].$or[0].catalog_type_id===chair.types[0].id,'exact type filter');check(captured.$and[1].$or[1].$and[1].subcategory.$regex==='^Dining chairs$','legacy type names match exactly');
  check((await request('/products?category=chair&type=custom-model')).status===400,'cross-category result query rejected');check((await request('/products?type=rocking-chairs')).status===400,'type query requires category');
  check((await request('/admin/catalog/image','POST',{kind:'other',base64:'invalid'},'admin')).status===400,'unrecognized image folder rejected');
  r=await request('/admin/catalog','PUT',{revision:1,categories:[]},'admin');check(r.status===200,'empty catalogue supported');check((await request('/catalog')).data.categories.length===0,'empty catalogue does not restore old defaults');
  console.log(`${checks} catalog API checks passed using in-memory database substitutes; no Atlas or Cloudinary writes.`);
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();}
});
