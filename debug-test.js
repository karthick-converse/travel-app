const request = require('supertest');
const app = require('./dist/app.js').default;
const { connectTestDB, closeTestDB } = require('./dist/tests/setup/db.js');

async function debugTest() {
  try {
    await connectTestDB();
    
    const payload = {
      name: "Test User",
      email: "test@example.com",
      password: "Password@123",
    };

    console.log('Sending registration request...');
    const res = await request(app).post("/api/auth/register").send(payload);
    
    console.log('Status:', res.status);
    console.log('Body:', res.body);
    
    await closeTestDB();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTest();