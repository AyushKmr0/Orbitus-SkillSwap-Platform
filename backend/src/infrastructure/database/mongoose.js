import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Node.js EREFUSED on MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // ignore
}

export const connectDatabase = async (retryCount = 0) => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (retryCount < 5) {
      const waitTime = Math.min(1500 * (retryCount + 1), 8000);
      console.log(`Retrying MongoDB connection in ${waitTime / 1000}s... (Attempt ${retryCount + 1}/5)`);
      setTimeout(() => connectDatabase(retryCount + 1), waitTime);
    } else {
      console.error('Fatal: Failed to connect to MongoDB after multiple attempts.');
      process.exit(1);
    }
  }
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[DATABASE]: Mongoose disconnected cleanly.');
  }
};

export default connectDatabase;
