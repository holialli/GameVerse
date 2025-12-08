const mongoose = require('mongoose');
require('dotenv').config();

const fixUsernameIndex = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gameverse';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('users');

    // List all indexes
    const indexes = await collection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));

    // Drop the old username_1 index if it exists
    if (indexes.username_1) {
      await collection.dropIndex('username_1');
      console.log('✓ Dropped old username_1 index');
    } else {
      console.log('No username_1 index found');
    }

    // Create new sparse index for username
    await collection.createIndex({ username: 1 }, { sparse: true });
    console.log('✓ Created new sparse username index');

    // Verify new indexes
    const newIndexes = await collection.getIndexes();
    console.log('Updated indexes:', Object.keys(newIndexes));

    console.log('\n✓ Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error.message);
    process.exit(1);
  }
};

fixUsernameIndex();
