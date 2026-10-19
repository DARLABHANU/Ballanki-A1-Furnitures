const router=require('express').Router();
const {authenticate,roles}=require('../middleware/auth');
const {asyncRoute:wrap,fail}=require('../lib/http');
const {readCatalog,publicCatalog,saveCatalog}=require('../lib/catalog');
router.get('/catalog',wrap(async(req,res)=>res.json(publicCatalog(await readCatalog()))));
router.get('/admin/catalog',authenticate,roles('admin'),wrap(async(req,res)=>res.json(await readCatalog())));
router.put('/admin/catalog',authenticate,roles('admin'),wrap(async(req,res)=>res.json(await saveCatalog(req.body?.revision,req.body?.categories))));
router.post('/admin/catalog/image',authenticate,roles('admin'),wrap(async(req,res)=>{
 const kind=req.body?.kind||'category';if(!['category','type'].includes(kind))fail(400,'Choose a category or type image');
 res.status(201).json(await require('../lib/cloudinary').uploadProductImage(req.body?.base64,kind==='type'?'ballanki/category-types':'ballanki/categories'));
}));
module.exports=router;
