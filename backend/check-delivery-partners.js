import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DeliveryPartner from './src/models/DeliveryPartner.js';

dotenv.config();

async function checkDeliveryPartners() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all delivery partners
    const allPartners = await DeliveryPartner.find({});
    console.log(`📊 Total Delivery Partners: ${allPartners.length}\n`);

    if (allPartners.length === 0) {
      console.log('⚠️  No delivery partners found in database!');
      console.log('   Please register delivery partners first.\n');
      process.exit(0);
    }

    // Show details of each partner
    console.log('📋 Delivery Partners Details:\n');
    allPartners.forEach((partner, index) => {
      console.log(`${index + 1}. ${partner.name}`);
      console.log(`   Email: ${partner.email}`);
      console.log(`   Phone: ${partner.phone || 'N/A'}`);
      console.log(`   Available: ${partner.isAvailable ? '✅ Yes' : '❌ No'}`);
      console.log(`   Online: ${partner.isOnline ? '✅ Yes' : '❌ No'}`);
      console.log(`   Will receive notifications: ${partner.isAvailable && partner.isOnline ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });

    // Show available partners
    const availablePartners = await DeliveryPartner.find({ 
      isAvailable: true,
      isOnline: true 
    });
    
    console.log(`\n🟢 Partners that will receive notifications: ${availablePartners.length}`);
    if (availablePartners.length > 0) {
      availablePartners.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} (${p.email})`);
      });
    } else {
      console.log('\n⚠️  WARNING: No delivery partners are set as both available AND online!');
      console.log('   To fix this, set delivery partners as:');
      console.log('   - isAvailable: true');
      console.log('   - isOnline: true\n');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDeliveryPartners();
