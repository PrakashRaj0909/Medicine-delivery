/**
 * Clear All MongoDB Data
 * This will delete all data from all collections
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function clearAllData() {
  try {
    console.log('🗑️  Clearing all MongoDB data...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}\n`);

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collection(s):\n`);

    // Delete all documents from each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
      console.log(`   ✅ ${collectionName}: Deleted ${result.deletedCount} document(s)`);
    }

    console.log('\n🎉 All data cleared successfully!');
    console.log('   You can now register new users from scratch.\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the function
clearAllData();
