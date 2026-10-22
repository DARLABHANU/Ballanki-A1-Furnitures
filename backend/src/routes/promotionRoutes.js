const router=require('express').Router();
const {authenticate,roles}=require('../middleware/auth');const {asyncRoute:wrap,fail}=require('../lib/http');const promotions=require('../lib/promotions');
router.get('/promotions',wrap(async(req,res)=>res.json(promotions.publicView(await promotions.read()))));
router.get('/admin/promotions',authenticate,roles('admin'),wrap(async(req,res)=>res.json(await promotions.read())));
router.put('/admin/promotions',authenticate,roles('admin'),wrap(async(req,res)=>res.json(await promotions.save(req.body.revision,req.body.banners))));
router.post('/admin/promotions/image',authenticate,roles('admin'),wrap(async(req,res)=>{
 const image=await require('../lib/cloudinary').uploadProductImage(req.body.base64,'ballanki/promotions');
 if(image.width&&image.height&&image.width<=image.height)fail(400,'Use a landscape rectangular banner (width must exceed height)');
 res.status(201).json(image);
}));
module.exports=router;
