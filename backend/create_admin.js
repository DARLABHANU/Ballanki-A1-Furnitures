require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
    console.log('Connected to MongoDB.');
    const email = 'admin@ballanki@gmail.com';
    const password = 'Ballanki@sai';
    
    let user = await User.findOne({ email });
    if (!user) {
        user = new User({ email, full_name: 'Ballanki Admin', role: 'admin', account_number: 'BA-ADMIN-1' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.role = 'admin';
    user.is_verified = true;
    user.is_active = true;
    
    await user.save();
    console.log('Admin user created/updated successfully!');
    process.exit(0);
})
.catch((err) => { console.error(err); process.exit(1); });
