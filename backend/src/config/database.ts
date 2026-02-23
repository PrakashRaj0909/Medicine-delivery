import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mediexpress';

  await mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log('✅ MongoDB connected successfully');
  console.log(`📦 Database: ${mongoose.connection.name}`);
  console.log(`🌐 Host: ${mongoose.connection.host}`);
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

export const getMongoConnectionState = () => {
  const states: Record<number, 'disconnected' | 'connected' | 'connecting' | 'disconnecting'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] || 'disconnected';
};

export default connectDB;
