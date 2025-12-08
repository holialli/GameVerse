const dns = require('dns').promises;
const net = require('net');

async function testMongoConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...\n');

  const uri = 'mongodb+srv://ali1305123456789_db_user:rgL8EJPuucuRIosP@cluster0.kfhvj60.mongodb.net/gameverse';
  const host = 'cluster0.kfhvj60.mongodb.net';
  const srvRecord = '_mongodb._tcp.cluster0.kfhvj60.mongodb.net';

  // Test 1: DNS Resolution
  console.log('1️⃣ Testing DNS Resolution...');
  try {
    const addresses = await dns.resolve4(host);
    console.log(`   ✅ DNS resolved ${host} to:`, addresses);
  } catch (err) {
    console.log(`   ❌ DNS resolution failed: ${err.message}`);
    console.log('   This means your network is blocking MongoDB DNS lookups');
    return;
  }

  // Test 2: SRV Record Lookup
  console.log('\n2️⃣ Testing SRV Record Lookup...');
  try {
    const srvRecords = await dns.resolveSrv(srvRecord);
    console.log(`   ✅ SRV records found:`, srvRecords);
  } catch (err) {
    console.log(`   ❌ SRV lookup failed: ${err.message}`);
    console.log('   Your network might be blocking SRV queries');
  }

  // Test 3: Port Connectivity
  console.log('\n3️⃣ Testing Port Connectivity to MongoDB...');
  try {
    await testPort(host, 27017);
    console.log(`   ✅ Can connect to ${host}:27017`);
  } catch (err) {
    console.log(`   ❌ Cannot connect to ${host}:27017: ${err.message}`);
  }

  // Test 4: Mongoose Connection
  console.log('\n4️⃣ Testing Mongoose Connection...');
  try {
    const mongoose = require('mongoose');
    mongoose.set('strictQuery', false);
    
    console.log('   Attempting to connect...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log('   ✅ Successfully connected to MongoDB Atlas!');
    await mongoose.disconnect();
  } catch (err) {
    console.log(`   ❌ Connection failed: ${err.message}`);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('   → Possible causes:');
      console.log('     - Firewall blocking MongoDB port 27017');
      console.log('     - Corporate/School network restrictions');
      console.log('     - VPN interfering');
      console.log('     - Antivirus blocking connections');
    }
  }

  console.log('\n📋 Summary:');
  console.log('   If all tests pass → Atlas connection should work');
  console.log('   If DNS fails → Network is blocking MongoDB');
  console.log('   If only SRV fails → Try direct connection string');
}

function testPort(host, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = 5000;

    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Timeout after ${timeout}ms`));
    });
    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.connect(port, host);
  });
}

testMongoConnection().catch(console.error);
