#!/usr/bin/env node

/**
 * Comprehensive Booking UI Test Suite
 * Tests both admin and user booking systems with complimentary booking features
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComprehensiveBookingTestSuite {
  constructor() {
    this.testResults = {
      adminBookingTest: { status: 'pending', output: [], errors: [] },
      userBookingTest: { status: 'pending', output: [], errors: [] }
    };
    this.startTime = Date.now();
  }

  async runTest(testFile, testName) {
    return new Promise((resolve, reject) => {
      console.log(`\n🚀 Starting ${testName}...`);
      console.log(`📁 Test file: ${testFile}`);
      console.log('='.repeat(60));

      const testProcess = spawn('node', [testFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(testFile)
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output); // Real-time output
      });

      testProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        process.stderr.write(error); // Real-time error output
      });

      testProcess.on('close', (code) => {
        console.log(`\n📊 ${testName} completed with exit code: ${code}`);
        
        resolve({
          success: code === 0,
          stdout: stdout,
          stderr: stderr,
          exitCode: code
        });
      });

      testProcess.on('error', (error) => {
        console.error(`❌ Error running ${testName}:`, error);
        reject(error);
      });
    });
  }

  async runAllTests() {
    console.log('🎯 COMPREHENSIVE BOOKING UI TEST SUITE');
    console.log('=====================================\n');
    console.log('📋 Test Plan:');
    console.log('   1. Admin Booking System - Regular & Complimentary');
    console.log('   2. User Booking System - Credit Card Visibility');
    console.log('   3. Cross-System Compatibility Analysis\n');

    const testFiles = [
      {
        file: '/home/ittz/projects/itt/site/test-admin-booking-complete-x11-v2.js',
        name: 'Admin Booking Test',
        key: 'adminBookingTest'
      },
      {
        file: '/home/ittz/projects/itt/site/test-user-booking-complimentary.js',
        name: 'User Booking Test',
        key: 'userBookingTest'
      }
    ];

    // Run tests sequentially to avoid browser conflicts
    for (const test of testFiles) {
      try {
        const result = await this.runTest(test.file, test.name);
        this.testResults[test.key] = {
          status: result.success ? 'passed' : 'failed',
          output: result.stdout.split('\n'),
          errors: result.stderr ? result.stderr.split('\n') : [],
          exitCode: result.exitCode
        };
      } catch (error) {
        this.testResults[test.key] = {
          status: 'error',
          output: [],
          errors: [error.message],
          exitCode: -1
        };
      }
    }

    // Generate comprehensive report
    this.generateReport();
  }

  generateReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE BOOKING TEST REPORT');
    console.log('='.repeat(80));

    console.log(`\n⏱️  Total Test Duration: ${duration} seconds`);
    console.log(`📅 Test Completed: ${new Date().toLocaleString()}`);

    // Test Results Summary
    console.log('\n🧪 TEST RESULTS SUMMARY:');
    console.log('-'.repeat(40));

    Object.entries(this.testResults).forEach(([testKey, result]) => {
      const testName = testKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const statusIcon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      const statusText = result.status.toUpperCase();
      
      console.log(`${statusIcon} ${testName}: ${statusText}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          if (error.trim()) {
            console.log(`   🔴 ${error.trim()}`);
          }
        });
      }
    });

    // Analysis of results
    console.log('\n🔍 ANALYSIS & RECOMMENDATIONS:');
    console.log('-'.repeat(40));

    const adminTestPassed = this.testResults.adminBookingTest.status === 'passed';
    const userTestPassed = this.testResults.userBookingTest.status === 'passed';

    if (adminTestPassed && userTestPassed) {
      console.log('✅ ALL SYSTEMS OPERATIONAL');
      console.log('   - Admin booking system fully functional');
      console.log('   - User booking system supports complimentary bookings');
      console.log('   - Credit card visibility working correctly');
    } else if (adminTestPassed && !userTestPassed) {
      console.log('⚠️  PARTIAL FUNCTIONALITY');
      console.log('   - Admin booking system working correctly');
      console.log('   - User booking system needs complimentary support');
      console.log('   - Recommend implementing user complimentary booking features');
    } else if (!adminTestPassed && userTestPassed) {
      console.log('⚠️  ADMIN SYSTEM ISSUES');
      console.log('   - User booking system functional');
      console.log('   - Admin booking system has problems');
      console.log('   - Check admin dashboard functionality');
    } else {
      console.log('❌ SYSTEM FAILURES DETECTED');
      console.log('   - Both admin and user systems need attention');
      console.log('   - Review implementation and fix critical issues');
    }

    // Feature Implementation Status
    console.log('\n🚀 FEATURE IMPLEMENTATION STATUS:');
    console.log('-'.repeat(40));

    const features = [
      {
        name: 'Admin Regular Booking with Tip',
        implemented: adminTestPassed,
        priority: 'HIGH'
      },
      {
        name: 'Admin Complimentary Booking',
        implemented: adminTestPassed,
        priority: 'HIGH'
      },
      {
        name: 'Credit Card Section Hide/Show',
        implemented: adminTestPassed,
        priority: 'HIGH'
      },
      {
        name: 'User Complimentary Booking',
        implemented: userTestPassed,
        priority: 'MEDIUM'
      },
      {
        name: 'User Credit Card Visibility',
        implemented: userTestPassed,
        priority: 'MEDIUM'
      }
    ];

    features.forEach(feature => {
      const statusIcon = feature.implemented ? '✅' : '❌';
      const priorityColor = feature.priority === 'HIGH' ? '🔴' : '🟡';
      console.log(`${statusIcon} ${feature.name} ${priorityColor} ${feature.priority}`);
    });

    // Next Steps
    console.log('\n📋 NEXT STEPS & ACTION ITEMS:');
    console.log('-'.repeat(40));

    if (!adminTestPassed) {
      console.log('1. 🔧 Fix admin booking system issues');
      console.log('   - Review error logs above');
      console.log('   - Test admin dashboard functionality');
      console.log('   - Verify database connectivity');
    }

    if (!userTestPassed) {
      console.log('2. 🛠️  Implement user complimentary booking support');
      console.log('   - Add URL parameter support (?booking_type=complimentary)');
      console.log('   - Modify booking-checkout.js to handle comp bookings');
      console.log('   - Hide credit card section for complimentary bookings');
      console.log('   - Skip payment processing for comp bookings');
    }

    console.log('3. 🧪 Re-run tests after fixes');
    console.log('   - Execute: node test-comprehensive-booking-ui.js');
    console.log('   - Verify all tests pass');
    console.log('   - Test in production environment');

    // Screenshots and logs
    console.log('\n📸 EVIDENCE & LOGS:');
    console.log('-'.repeat(40));
    console.log('Screenshots saved to: /tmp/');
    console.log('- admin-booking-test-*.png');
    console.log('- booking-form-*.png');
    console.log('- payment-modal-*.png');
    console.log('- comp-booking-*.png');

    // Overall result
    const overallSuccess = adminTestPassed && userTestPassed;
    console.log('\n🏁 OVERALL RESULT:');
    console.log('-'.repeat(40));
    console.log(`${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}: ${overallSuccess ? 'All booking systems operational' : 'Some systems need fixes'}`);

    console.log('\n' + '='.repeat(80));

    // Exit with appropriate code
    process.exit(overallSuccess ? 0 : 1);
  }
}

// Check for required dependencies
const requiredFiles = [
  '/home/ittz/projects/itt/site/test-admin-booking-complete-x11-v2.js',
  '/home/ittz/projects/itt/site/test-user-booking-complimentary.js'
];

console.log('🔍 Checking test dependencies...');
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Required test file not found: ${file}`);
    process.exit(1);
  } else {
    console.log(`✅ Found: ${path.basename(file)}`);
  }
});

// Run the test suite
const testSuite = new ComprehensiveBookingTestSuite();
testSuite.runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});