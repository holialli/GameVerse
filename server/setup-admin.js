#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const { sendWelcomeEmail } = require('./services/emailService');

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gameverse', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    // Check if holialli exists by email
    let holialli = await User.findOne({ email: 'ali1305123456789@gmail.com' });

    if (!holialli) {
      console.log('📝 Creating holialli admin account...\n');
      
      // Create holialli account
      holialli = await User.create({
        name: 'Holialli',
        email: 'ali1305123456789@gmail.com',
        password: 'holialli',
        role: 'admin',
      });

      console.log('✅ Holialli admin account created!\n');

      // Send welcome email
      try {
        await sendWelcomeEmail(holialli.email, holialli.name);
        console.log('📧 Welcome email sent!\n');
      } catch (emailError) {
        console.log('⚠️  Could not send welcome email (non-critical):', emailError.message, '\n');
      }
    } else {
      console.log(`👤 Found user: ${holialli.name}\n`);
      console.log(`Current role: ${holialli.role}`);

      if (holialli.role !== 'admin') {
        holialli.role = 'admin';
        await holialli.save();
        console.log('✅ Updated user to admin role!\n');
      } else {
        console.log('✅ User is already admin!\n');
      }
    }

    // Remove admin role from all other users
    const otherAdmins = await User.find({ role: 'admin', email: { $ne: 'ali1305123456789@gmail.com' } });

    if (otherAdmins.length > 0) {
      console.log(`⚠️  Found ${otherAdmins.length} other admin user(s). Removing admin role...\n`);
      
      for (const user of otherAdmins) {
        user.role = 'user';
        await user.save();
        console.log(`  ✅ ${user.username} (${user.email}) → user`);
      }
      console.log();
    } else {
      console.log('✅ No other admin users found\n');
    }

    // Show final admin status
    console.log('='.repeat(60));
    console.log('📊 FINAL ADMIN STATUS:');
    console.log('='.repeat(60));
    console.log(`👑 Admin Name: ${holialli.name}`);
    console.log(`📧 Admin Email: ${holialli.email}`);
    console.log(`🔐 Admin Password: holialli`);
    
    const allUsers = await User.find({});
    console.log(`\n📊 Total users: ${allUsers.length}`);
    console.log(`👨‍💼 Admins: 1`);
    console.log(`👥 Regular users: ${allUsers.length - 1}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

setupAdmin();
