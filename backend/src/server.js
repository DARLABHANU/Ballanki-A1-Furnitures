const path=require('path');require('dotenv').config({path:path.resolve(__dirname,'../.env')});
const mongoose=require('mongoose');const bcrypt=require('bcryptjs');const User=require('./models/User');const {secret}=require('./middleware/auth');const app=require('./app');const connectDB=require('./config/db');
async function start(){
 secret();if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required');
 await connectDB();
 await Promise.all(Object.values(mongoose.models).map(model=>model.init()));
 if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){
  const exists=await User.findOne({email:process.env.ADMIN_EMAIL.toLowerCase()});
  if(!exists)await User.create({email:process.env.ADMIN_EMAIL,hashed_password:await bcrypt.hash(process.env.ADMIN_PASSWORD,12),full_name:'Local Administrator',role:'admin',is_verified:true});
 }
 const server=app.listen(Number(process.env.PORT)||8000,process.env.HOST||'127.0.0.1',()=>console.log('Backend ready at http://localhost:'+(process.env.PORT||8000)+' — database '+mongoose.connection.name+' connected; payments pending'));
 server.on('error',error=>{console.error('Cannot start server:',error.message);mongoose.disconnect().finally(()=>process.exit(1));});
 const stop=()=>server.close(()=>mongoose.disconnect().finally(()=>process.exit(0)));process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
start().catch(error=>{console.error('Startup failed:',error.message);process.exit(1);});
