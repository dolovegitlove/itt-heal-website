#!/usr/bin/env node
require('dotenv').config({ path: '../shared/.env.production' });

const { Sequelize } = require('sequelize');

console.log('Testing database connection with backend config...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'itt_heal_shared_db',
  username: process.env.DB_USER || 'itt_user',
  password: process.env.DB_PASSWORD || 'itt_secure_password',
  logging: console.log
});

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM massage_sessions');
    console.log('📋 Bookings found:', results[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

test();