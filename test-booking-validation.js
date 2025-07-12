#!/usr/bin/env node

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'x-admin-access': 'dr-shiffer-emergency-access'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({error: 'Invalid JSON', raw: data}); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function validatePhoneNumber(phone) {
  if (!phone) {return false;}
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  let tenDigitNumber = cleanPhone;
  if (cleanPhone.startsWith('+1')) {tenDigitNumber = cleanPhone.slice(2);}
  else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {tenDigitNumber = cleanPhone.slice(1);}
  if (tenDigitNumber.length !== 10) {return false;}

  const areaCode = tenDigitNumber.slice(0, 3);
  const validAreaCodes = ['201','202','203','205','206','207','208','209','210','212','213','214','215','216','217','218','219','224','225','228','229','231','234','239','240','248','251','252','253','254','256','260','262','267','269','270','272','274','276','281','283','301','302','303','304','305','307','308','309','310','312','313','314','315','316','317','318','319','320','321','323','325','330','331','334','336','337','339','346','347','351','352','360','361','364','380','385','386','401','402','404','405','406','407','408','409','410','412','413','414','415','417','419','423','424','425','430','432','434','435','440','442','443','458','463','464','469','470','475','478','479','480','484','501','502','503','504','505','507','508','509','510','512','513','515','516','517','518','520','530','531','534','539','540','541','551','559','561','562','563','564','567','570','571','573','574','575','580','585','586','601','602','603','605','606','607','608','609','610','612','614','615','616','617','618','619','620','623','626','628','629','630','631','636','641','646','650','651','657','660','661','662','667','669','678','681','682','701','702','703','704','706','707','708','712','713','714','715','716','717','718','719','720','724','725','727','731','732','734','737','740','743','747','754','757','760','762','763','765','769','770','772','773','774','775','779','781','785','786','787','801','802','803','804','805','806','808','810','812','813','814','815','816','817','818','828','830','831','832','843','845','847','848','850','854','856','857','858','859','860','862','863','864','865','870','872','878','901','903','904','906','907','908','909','910','912','913','914','915','916','917','918','919','920','925','928','929','930','931','934','936','937','938','940','941','947','949','951','952','954','956','959','970','971','972','973','978','979','980','984','985','989'];
  if (!validAreaCodes.includes(areaCode)) {return false;}

  // Validate exchange code (first 3 digits after area code)
  const exchangeCode = tenDigitNumber.slice(3, 6);

  // Exchange code cannot start with 0 or 1
  if (exchangeCode.startsWith('0') || exchangeCode.startsWith('1')) {
    return false;
  }

  // Exchange code cannot be N11 codes (211, 311, 411, 511, 611, 711, 811, 911)
  if (exchangeCode.match(/^[2-9]11$/)) {
    return false;
  }

  // Block fake/test exchange codes
  const invalidExchangeCodes = [
    '555', // Fictional numbers
    '000', '001', '002', '003', '004', '005', '006', '007', '008', '009', // Reserved
    '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', // Reserved
    '950', '951', '952', '953', '954', '955', '956', '957', '958', '959', // Special services
    '976', '977', '987', '988', '989', // Premium rate services
    '900', '901', '902', '903', '904', '905', '906', '907', '908', '909' // Premium services
  ];

  if (invalidExchangeCodes.includes(exchangeCode)) {
    return false;
  }

  // Validate last 4 digits (subscriber number)
  const subscriberNumber = tenDigitNumber.slice(6);

  // Subscriber number cannot be 0000
  if (subscriberNumber === '0000') {
    return false;
  }

  for (let i = 0; i <= tenDigitNumber.length - 4; i++) {
    const fourDigits = tenDigitNumber.slice(i, i + 4);
    if (fourDigits[0] === fourDigits[1] && fourDigits[1] === fourDigits[2] && fourDigits[2] === fourDigits[3]) {
      return false;
    }
  }
  return true;
}

function validateEmailAddress(email) {
  if (!email) {return false;}
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {return false;}
  const domain = email.split('@')[1];
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1].toLowerCase();
  const validTlds = ['com','org','net','edu','gov','mil','int','co','io','me','tv','info','biz','us','uk','ca','au','de','fr','it','jp','cn','in','br','mx','es','ru','nl','se','no','dk','fi','pl','be','ch','at','ie','il','za','nz','sg'];
  return validTlds.includes(tld);
}

function validateClientName(name) {
  if (!name) {return false;}
  const cleanName = name.trim();
  if (cleanName.length < 3) {return false;}
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(cleanName)) {return false;}
  const fakeNames = ['test','fake','john doe','jane doe','test test','name name','first last','client client','user user','person person','aaa','bbb','ccc','abc','123','xxx','yyy','zzz','asdf','qwerty','admin','guest','temp','temporary'];
  if (fakeNames.includes(cleanName.toLowerCase())) {return false;}
  if (cleanName.match(/(.)\1{2,}/)) {return false;}
  return true;
}

async function validateBookings() {
  try {
    console.log('🔍 FIELD VALIDATION TEST - EXISTING BOOKINGS');
    console.log('===========================================\n');

    const response = await makeRequest('/api/admin/bookings');

    if (!response.bookings) {
      console.error:', response);
      return;
    }

    console.log(`📊 Testing ${response.bookings.length} current bookings:\n`);

    let invalidCount = 0;
    const issues = [];

    response.bookings.forEach((booking, index) => {
      const phone = booking.client_phone || booking.guest_phone;
      const email = booking.client_email || booking.guest_email;
      const name = booking.client_name || booking.guest_name || 'Unknown';

      console.log(`${index + 1}. ${name} (ID: ${booking.id})`);

      let hasIssues = false;
      const bookingIssues = [];

      if (phone) {
        const phoneValid = validatePhoneNumber(phone);
        console.log(`   📞 Phone: ${phone} - ${phoneValid ? '✅ Valid' : '❌ Invalid'}`);
        if (!phoneValid) {
          hasIssues = true;
          bookingIssues.push(`Invalid phone: ${phone}`);
        }
      } else {
        console.log('   📞 Phone: ⚠️ Missing');
        bookingIssues.push('Missing phone number');
      }

      if (email) {
        const emailValid = validateEmailAddress(email);
        console.log(`   📧 Email: ${email} - ${emailValid ? '✅ Valid' : '❌ Invalid'}`);
        if (!emailValid) {
          hasIssues = true;
          bookingIssues.push(`Invalid email: ${email}`);
        }
      } else {
        console.log('   📧 Email: ⚠️ Missing');
        bookingIssues.push('Missing email address');
      }

      const nameValid = validateClientName(name);
      console.log(`   👤 Name: ${name} - ${nameValid ? '✅ Valid' : '❌ Invalid'}`);
      if (!nameValid) {
        hasIssues = true;
        bookingIssues.push(`Invalid name: ${name}`);
      }

      console.log(`   📅 Date: ${new Date(booking.scheduled_date).toLocaleString()}`);
      console.log(`   💰 Price: $${booking.final_price}`);

      if (hasIssues) {
        invalidCount++;
        issues.push({
          id: booking.id,
          name: name,
          issues: bookingIssues
        });
      }
      console.log('');
    });

    console.log('\n📊 VALIDATION SUMMARY:');
    console.log('=====================');
    console.log(`Total Bookings: ${response.bookings.length}`);
    console.log(`Valid Bookings: ${response.bookings.length - invalidCount}`);
    console.log(`Invalid Bookings: ${invalidCount}`);
    console.log(`Success Rate: ${Math.round(((response.bookings.length - invalidCount) / response.bookings.length) * 100)}%`);

    if (issues.length > 0) {
      console.log('\n🚨 BOOKINGS REQUIRING ATTENTION:');
      console.log('================================');
      issues.forEach(issue => {
        console.log(`• ${issue.name} (ID: ${issue.id})`);
        issue.issues.forEach(problem => {
          console.log(`  - ${problem}`);
        });
        console.log('');
      });
    } else {
      console.log('\n🎉 ALL BOOKINGS PASS VALIDATION!');
    }

  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
  }
}

validateBookings();
