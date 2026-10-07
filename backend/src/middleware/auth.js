const jwt=require('jsonwebtoken');
const User=require('../models/User');
const {asyncRoute,fail}=require('../lib/http');
const secret=()=>{if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length<32)throw new Error('JWT_SECRET must have at least 32 characters');return process.env.JWT_SECRET;};
const authenticate=asyncRoute(async(req,res,next)=>{let p;try{p=jwt.verify((req.headers.authorization||'').replace(/^Bearer /i,''),secret(),{algorithms:['HS256']});}catch{fail(401,'Please sign in again');}if(p.type!=='access')fail(401,'Invalid access token');const u=await User.findById(p.user_id);if(!u||!u.is_active||(u.token_version||0)!==p.version)fail(401,'Session expired');if(u.role==='merchant')fail(403,'This account type is no longer supported');req.user=u;next();});
const roles=(...allowed)=>(req,res,next)=>allowed.includes(req.user.role)?next():res.status(403).json({error:'You do not have permission for this action'});
const tokens=u=>{if(u.role==='merchant')fail(403,'This account type is no longer supported');const c={user_id:String(u._id),version:u.token_version||0};return{access_token:jwt.sign({...c,type:'access'},secret(),{expiresIn:'30m'}),refresh_token:jwt.sign({...c,type:'refresh'},secret(),{expiresIn:'7d'}),role:u.role,user_id:String(u._id),user:u.toJSON()};};
module.exports={authenticate,roles,tokens,secret};
