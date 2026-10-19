const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
let result={categories:[],revision:0},calls=0,fail=false;
const exportsObject={};
const source=ts.transpileModule(fs.readFileSync('src/store/catalogStore.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInNewContext(source,{exports:exportsObject,URLSearchParams,Date,require:name=>name==='@/lib/api'?{api:{get:async()=>{calls++;if(fail)throw new Error('offline');return {data:result};}}}:require(name)});
const {useCatalogStore:store,catalogTypeHref,catalogCategoryHref}=exportsObject;
let checks=0;const check=(value,message)=>{assert.ok(value,message);checks++;};
(async()=>{
 const chair={id:'chair',name:'Renamed chairs',image:'https://example.com/new.jpg',active:true,solidWoodOnly:true,types:[{id:'rocker',name:'New display name',value:'Rocking chairs',image:'https://example.com/rocker.jpg',active:true},{id:'hidden',name:'Hidden type',value:'Hidden',image:'',active:false}]};
 result={revision:1,categories:[chair,{...chair,id:'hidden-category',active:false}]};
 await store.getState().refresh(true);
 check(store.getState().ready,'catalog loaded');check(store.getState().categories.length===1,'hidden category filtered');check(store.getState().categories[0].types.length===1,'hidden type filtered');check(store.getState().categories[0].name==='Renamed chairs','label updated');check(store.getState().categories[0].image===chair.image,'image updated');
 const href=new URL(catalogTypeHref(chair,chair.types[0]),'http://localhost');check(href.searchParams.get('category')==='chair','stable category id');check(href.searchParams.get('type')==='rocker','stable type id');check(href.searchParams.get('subcategory')==='Rocking chairs','stable matching value after rename');check(href.searchParams.get('construction')==='solid_wood','solid wood filter');check(!catalogCategoryHref({...chair,solidWoodOnly:false}).includes('construction'),'non-wood filter optional');
 const before=calls;await Promise.all([store.getState().refresh(true),store.getState().refresh(true)]);check(calls===before+1,'concurrent refresh deduplicated');
 fail=true;await store.getState().refresh(true);check(store.getState().categories[0].name==='Renamed chairs','temporary failure keeps last saved data');check(!!store.getState().error,'refresh error exposed');
 store.getState().publish({revision:2,categories:[{...chair,name:'Immediate admin update'}]});check(store.getState().categories[0].name==='Immediate admin update','admin publish updates mounted consumers');check(store.getState().error==='','successful publish clears error');
 fail=false;result={revision:3,categories:[]};await store.getState().refresh(true);check(store.getState().categories.length===0,'empty saved catalog does not restore defaults');
 console.log(`${checks} shared catalog store and stable-link checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
