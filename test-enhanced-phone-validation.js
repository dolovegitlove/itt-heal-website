#!/usr/bin/env node

// Enhanced Phone Validation Test
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

console.log('📱 ENHANCED PHONE VALIDATION TEST');
console.log('=================================\n');

const testNumbers = [
  // Valid numbers
  '4695251001', // Valid (469-525-1001)
  '2125551234', // Valid (212-555 should fail now)
  '4692341001', // Valid (469-234-1001)
  '3125551001', // Valid area, invalid exchange (555)

  // Invalid due to exchange codes
  '4695551234', // Invalid (555 exchange)
  '4692111234', // Invalid (211 exchange - N11)
  '4693111234', // Invalid (311 exchange - N11)
  '4694111234', // Invalid (411 exchange - N11)
  '4691001234', // Invalid (100 exchange - reserved)
  '4690001234', // Invalid (000 exchange - reserved)

  // Invalid due to subscriber number
  '4695250000', // Invalid (0000 subscriber)

  // Still invalid from before
  '555-0123', // Too short
  '1234567890', // Invalid sequence
  '4691111234' // Too many 1s
];

console.log('Testing phone numbers with enhanced validation:\n');

testNumbers.forEach(phone => {
  const result = validatePhoneNumber(phone);
  const clean = phone.replace(/[^\d]/g, '');

  if (clean.length === 10) {
    const areaCode = clean.slice(0, 3);
    const exchange = clean.slice(3, 6);
    const subscriber = clean.slice(6);
    console.log(`${phone.padEnd(15)} -> ${result ? '✅ Valid' : '❌ Invalid'} (${areaCode}-${exchange}-${subscriber})`);
  } else {
    console.log(`${phone.padEnd(15)} -> ${result ? '✅ Valid' : '❌ Invalid'} (${phone})`);
  }
});

console.log('\n📊 VALIDATION IMPROVEMENTS:');
console.log('==========================');
console.log('✅ Area codes: Must be registered NANP codes');
console.log('✅ Exchange codes: Cannot start with 0 or 1');
console.log('✅ Exchange codes: Cannot be N11 (211, 311, etc.)');
console.log('✅ Exchange codes: Blocks 555 and other fake/reserved codes');
console.log('✅ Subscriber numbers: Cannot be 0000');
console.log('✅ Pattern checks: No 4+ consecutive repeating digits');
console.log('✅ Length validation: Exactly 10 digits (US numbers)');
