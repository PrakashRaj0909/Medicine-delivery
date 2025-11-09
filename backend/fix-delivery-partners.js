/**
 * Fix Delivery Partners - Set them as online and available
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixDeliveryPartners() {
  try {
    console.log('🔧 Fixing delivery partners...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Update all delivery partners to be available and online
    const result = await mongoose.connection.db.collection('delivery_partners').updateMany(
      {}, // Update all delivery partners
      {
        $set: {
          isAvailable: true,
          isOnline: true
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} delivery partner(s)`);
    console.log('   Set isAvailable: true');
    console.log('   Set isOnline: true\n');

    // Get all partners to verify
    const partners = await mongoose.connection.db.collection('delivery_partners').find({}).toArray();
    
    console.log(`📋 Delivery Partners (${partners.length} total):\n`);
    partners.forEach((partner, index) => {
      console.log(`${index + 1}. ${partner.name}`);
      console.log(`   Email: ${partner.email}`);
      console.log(`   Available: ${partner.isAvailable ? '✅' : '❌'}`);
      console.log(`   Online: ${partner.isOnline ? '✅' : '❌'}`);
      console.log(`   Will receive notifications: ${partner.isAvailable && partner.isOnline ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Done! Delivery partners will now receive email notifications.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDeliveryPartners();
