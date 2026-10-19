const assert=require('node:assert/strict'),crypto=require('node:crypto');
process.env.CLOUDINARY_CLOUD_NAME='configured-test-cloud';process.env.CLOUDINARY_API_KEY='test-key';process.env.CLOUDINARY_API_SECRET='test-secret';
const {uploadProductImage}=require('../src/lib/cloudinary');
let expectedFolder;
global.fetch=async(url,{body})=>{
 assert.equal(url,'https://api.cloudinary.com/v1_1/configured-test-cloud/image/upload');
 assert.equal(body.get('folder'),expectedFolder);assert.equal(body.get('api_key'),'test-key');
 assert.equal(body.get('signature'),crypto.createHash('sha256').update(`folder=${expectedFolder}&timestamp=${body.get('timestamp')}test-secret`).digest('hex'));
 return {ok:true,json:async()=>({secure_url:`https://res.cloudinary.com/configured-test-cloud/image/upload/${expectedFolder}/image.png`,public_id:expectedFolder+'/image'})};
};
(async()=>{
 const image='data:image/png;base64,iVBORw0KGgo=';
 for(const folder of ['ballanki/categories','ballanki/category-types','ballanki/products']){expectedFolder=folder;const result=await uploadProductImage(image,folder);assert.ok(result.url.includes('/'+folder+'/'));}
 expectedFolder='ballanki/products';await uploadProductImage(image);
 console.log('Cloudinary account URL, signed uploads, category/type/product folders and default product upload verified with a mocked provider; no external uploads.');
})().catch(e=>{console.error(e);process.exitCode=1;});
