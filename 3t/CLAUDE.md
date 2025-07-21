## System Administration

- Use sudo with permission issues always

## Monitoring Scripts Location
- **Master scripts**: `/home/ittz/itt-scripts/scripts/` (comprehensive versions)
- **Site-specific**: `/home/ittz/projects/itt/site/scripts/` (local versions)
- **App-specific**: `/home/ittz/projects/itt/app/scripts/` (mobile versions)

**IMPORTANT**: Redundant monitoring scripts have been removed from:
- `/home/ittz/projects/itt/site/d/scripts/` (deleted)
- `/home/ittz/projects/itt/site-dev/scripts/` (deleted)

## Before Creating New Scripts
**MANDATORY**: Always review existing scripts first to ensure no duplication:
1. Check `/home/ittz/itt-scripts/scripts/` for master versions
2. Check current project `scripts/` directory for local versions
3. Use `find /home/ittz -name "*script-name*"` to locate duplicates
4. Only create new scripts if functionality doesn't exist

# 🛑 STOP SIGNALS FOR CLAUDE - BACKEND-FIRST ENFORCEMENT

## IMMEDIATE STOP TRIGGERS:
- If Claude starts with HTML/CSS/JS - **STOP**
- If Claude says "let me create a form" - **STOP**
- If Claude says "I'll add a button" - **STOP**
- If Claude says "let me build the UI" - **STOP**
- If Claude writes any frontend code without showing curl tests - **STOP**
- If Claude creates modals/dialogs without API verification - **STOP**

## MANDATORY VALIDATION CHECKLIST:
Before Claude can write ANY frontend code, these MUST be completed IN ORDER:

### ✅ Backend Verification Checklist:
- [ ] **Show curl command**: Full curl test with headers and response
- [ ] **Verify endpoint exists**: Must return 200/201 status code
- [ ] **Document response structure**: Show full JSON response
- [ ] **Test error cases**: Show 400/401/404/500 responses
- [ ] **Verify database schema**: Show table structure and field types
- [ ] **Test data mutations**: POST/PUT/DELETE operations verified
- [ ] **Check field mapping**: Exact field names from API response
- [ ] **Validate data types**: Ensure frontend matches backend types
- [ ] **Schema compatibility check**: Verify existing schema supports new features
- [ ] **No new schema needed**: Confirm current database fields are sufficient

### 🚫 CONSEQUENCES FOR VIOLATIONS:
1. **Immediate Work Stoppage**: All frontend code must be deleted
2. **Redo From Start**: Must restart with backend verification
3. **Document Violation**: Claude must acknowledge what rule was broken
4. **No Deployment**: Code cannot be deployed until properly verified
5. **Violation Log**: Add entry to conversation log about violation
6. **Extra Verification**: Next 3 features require double backend checks

## ENFORCEMENT PHRASES TO USE:
- "CLAUDE.md violation - show backend first"
- "Stop - what API endpoint handles this?"
- "Backend check - show me the curl"
- "Delete that UI code - verify backend first"
- "What database fields exist for this?"
- "Show me the API contract first"
- "need new schema?" - Forces schema compatibility verification
- "Does existing schema support this feature?"

## CI/CD PIPELINE ENFORCEMENT:
```yaml
# Add to deployment pipeline
pre-deploy-checks:
  - name: Backend-First Validation
    rules:
      - No UI components without corresponding API tests
      - All forms must have backend endpoint documentation
      - API integration tests must pass before UI deployment
      - Backend changes require frontend compatibility check
  
  - name: CLAUDE.md Compliance Check
    script: |
      # Check for frontend files without backend tests
      if [ -z "$(find tests/api -name "*${feature}*")" ]; then
        echo "❌ CLAUDE.md VIOLATION: No API tests for frontend feature"
        exit 1
      fi
      
      # Verify API documentation exists
      if ! grep -q "endpoint.*${feature}" docs/api.md; then
        echo "❌ CLAUDE.md VIOLATION: No API documentation"
        exit 1
      fi
      
      # Check schema compatibility
      if ! curl -s -X GET "${API_URL}/api/admin/${feature}" | jq '.'; then
        echo "❌ CLAUDE.md VIOLATION: Schema compatibility not verified"
        exit 1
      fi
```

## AUTOMATED PRE-COMMIT HOOKS:
```bash
#!/bin/bash
# .git/hooks/pre-commit
# Prevent frontend commits without backend verification

if git diff --cached --name-only | grep -E '\.(html|js|jsx|css)$'; then
  if ! git diff --cached --name-only | grep -E 'test.*api.*\.js$'; then
    echo "❌ CLAUDE.md VIOLATION: Frontend changes require API tests"
    echo "Add API tests before committing frontend code"
    exit 1
  fi
fi
```

## SCHEMA VERIFICATION EXAMPLES:

### ✅ CORRECT: Schema Check Before Frontend Development
```bash
# 1. Check existing schema fields
curl -s -X GET "https://ittheal.com/api/admin/availability" | jq '.availability[0]'

# 2. Verify required fields exist
# OUTPUT: Shows date, start_time, end_time, duration fields exist
# CONCLUSION: No new schema needed for calendar features

# 3. Proceed with frontend development using existing fields
```

### ❌ INCORRECT: Skip Schema Verification
```javascript
// BAD: Writing frontend code without checking backend schema
function addTimeSlot() {
  // Assumes fields exist without verification
  return fetch('/api/admin/availability', {
    body: JSON.stringify({
      new_field: 'value'  // ❌ VIOLATION: Field not verified
    })
  });
}
```

### ✅ CORRECT: Schema-Verified Frontend Code
```javascript
// GOOD: Using verified existing schema fields
function addTimeSlot() {
  // Uses fields confirmed by curl test: date, start_time, end_time
  return fetch('/api/admin/availability', {
    body: JSON.stringify({
      date: selectedDate,        // ✅ Verified field
      start_time: startTime,     // ✅ Verified field  
      end_time: endTime,         // ✅ Verified field
      duration: 60               // ✅ Verified field
    })
  });
}
```

# 🖱️ REAL USER INTERACTION TESTING - MANDATORY RULES

## CRITICAL RULE: NO FAKE CLICKS OR PROGRAMMATIC SHORTCUTS

**When testing user interfaces, ONLY use real browser interactions that simulate actual human behavior.**

### 🚫 FORBIDDEN METHODS (Fake interactions):
```javascript
// ❌ NEVER USE THESE - They bypass real UI behavior
await page.selectOption('#dropdown', 'value');     // Fake - sets value directly
await page.fill('#input', 'text');                 // Fake - bypasses typing
await page.check('#checkbox');                     // Fake - bypasses click
await page.setInputFiles('#file', 'path');         // Fake - bypasses file dialog
```

### ✅ REQUIRED METHODS (Real interactions):
```javascript
// ✅ ALWAYS USE THESE - Real human-like interactions
await page.locator('#dropdown').click();           // Real click to open dropdown
await page.locator('#dropdown option[value="x"]').click(); // Real option click
await page.locator('#input').click();              // Real click to focus
await page.keyboard.type('text');                  // Real typing
await page.locator('#checkbox').click();           // Real checkbox click
await page.locator('#file').setInputFiles('path'); // Real file selection (acceptable)
```

## MANDATORY X11 REAL BROWSER SETUP:

### Installation Requirements:
```bash
# Install X11 virtual framebuffer for real browser testing
sudo apt-get update
sudo apt-get install -y xvfb x11vnc fluxbox

# Install VNC viewer for visual debugging
sudo apt-get install -y tightvncserver
```

### Standard Test Template:
```javascript
const { chromium } = require('playwright');

async function realUserTest() {
  const browser = await chromium.launch({
    headless: false,           // REQUIRED: Show real browser
    slowMo: 500,              // REQUIRED: Human-speed interactions
    args: [
      '--window-size=1920,1080',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  
  // ✅ CORRECT: Real dropdown interaction
  await page.locator('#time-select').click();     // Open dropdown with real click
  await page.waitForTimeout(500);                 // Wait for dropdown to open
  await page.locator('#time-select option[value="15:00"]').click(); // Real option click
  
  // ✅ VERIFY: Check that selection actually persisted
  const selectedValue = await page.locator('#time-select').inputValue();
  if (selectedValue !== '15:00') {
    throw new Error(`Real selection failed: expected 15:00, got ${selectedValue}`);
  }
}
```

### X11 Execution Command:
```bash
# Run with real X11 display
NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules xvfb-run -a node test-real-interactions.js

# For debugging with VNC (optional)
NODE_PATH=/home/ittz/.npm/_npx/e41f203b7505f1fb/node_modules DISPLAY=:99 node test-real-interactions.js
```

## TESTING VALIDATION REQUIREMENTS:

### 1. **Dropdown Testing**:
```javascript
// ✅ REQUIRED: Real dropdown interaction sequence
await page.locator('#dropdown').click();                    // Real click to open
await page.locator('#dropdown option:has-text("Option")').click(); // Real option selection
await page.waitForTimeout(1000);                           // Wait for state update
const value = await page.locator('#dropdown').inputValue(); // Verify persistence
```

### 2. **Form Input Testing**:
```javascript
// ✅ REQUIRED: Real typing interaction
await page.locator('#input').click();      // Real focus click
await page.keyboard.type('test@email.com'); // Real keyboard typing
await page.keyboard.press('Tab');          // Real tab navigation
```

### 3. **Multi-Step Form Testing**:
```javascript
// ✅ REQUIRED: Real step progression
await page.locator('[data-service="90min"]').click();  // Real service selection
await page.locator('#next-btn').click();               // Real next button
await page.locator('#date-input').click();             // Real date focus
await page.keyboard.type('2025-07-14');                // Real date typing
await page.locator('#time-dropdown').click();          // Real time dropdown
await page.locator('#time-dropdown option').first().click(); // Real time selection
```

## ENFORCEMENT:

### Pre-Test Checklist:
- [ ] Test uses `headless: false` for real browser
- [ ] Test uses real clicks instead of programmatic methods
- [ ] Test includes persistence verification
- [ ] Test runs with X11 virtual display
- [ ] Test simulates human-speed interactions

### Violation Consequences:
1. **Immediate test invalidation** - Results don't count
2. **Rewrite required** - Must use real interaction methods
3. **Additional verification** - Next test requires extra validation
4. **Documentation update** - Must document what was wrong

## STANDARD REAL INTERACTION TEST SUITE:

Create this file for every UI feature:
```bash
# File: test-real-ui-[feature].js
# Purpose: Verify [feature] works with real human interactions
# Method: X11 real browser with actual clicks and typing
# Validation: Verify all state changes persist and function correctly
```

# 🔧 MANDATORY FRONTEND-BACKEND INTEGRATION VALIDATION

## CRITICAL INTEGRATION VALIDATOR: `validate-frontend-backend-integration.js`

**This validator prevents ALL types of frontend-backend mismatches including:**
- API endpoint mismatches (wrong URLs, missing endpoints)
- Service type mismatches (like the payment intent failure)
- Data attribute inconsistencies
- HTTP method mismatches
- Request/response field mismatches
- Enum value mismatches

### 🚨 MANDATORY EXECUTION SCHEDULE:

#### 1. **Before Every Deployment**
```bash
# MUST pass before any deployment
node validate-frontend-backend-integration.js
if [ $? -ne 0 ]; then
  echo "❌ DEPLOYMENT BLOCKED: Integration validation failed"
  exit 1
fi
```

#### 2. **CI/CD Pipeline Integration**
```yaml
# Add to .github/workflows/ or CI/CD pipeline
pre-deploy-validation:
  - name: Frontend-Backend Integration Check
    run: |
      cd /home/ittz/projects/itt/site
      node validate-frontend-backend-integration.js
    continue-on-error: false  # BLOCK deployment on failure
```

#### 3. **After Frontend OR Backend Changes**
```bash
# Run after ANY code changes to either side
git add .
node validate-frontend-backend-integration.js  # MUST pass
git commit -m "Changes validated with integration check"
```

#### 4. **Weekly Scheduled Validation**
```bash
# Add to crontab for weekly validation
# 0 8 * * 1 /usr/bin/node /home/ittz/projects/itt/site/validate-frontend-backend-integration.js
```

### 📋 **Integration Validation Report Location:**
- Report saved to: `./logs/frontend-backend-validation-report.json`
- Contains detailed breakdown of all validation categories
- Includes recommendations for fixing detected issues

### 🛑 **VALIDATION FAILURE POLICY:**
- **NO deployment** until validation passes
- **NO merging** pull requests with validation failures  
- **NO ignoring** validation warnings without documented exceptions
- **IMMEDIATE fix** required for all integration mismatches

### ✅ **Validation Categories Checked:**
1. **API_ENDPOINTS** - All frontend API calls have working backend endpoints
2. **DATA_ATTRIBUTES** - HTML data attributes are used consistently in JavaScript
3. **REQUEST_RESPONSE_FIELDS** - Field mapping between frontend requests and backend responses
4. **ENUM_VALUES** - Service types, payment methods, statuses match between frontend and backend
5. **HTTP_METHODS** - Request methods (GET/POST/PUT/DELETE) are supported by backend

### 🔧 **Quick Validation Commands:**
```bash
# Run full validation
node validate-frontend-backend-integration.js

# Check validation report
cat ./logs/frontend-backend-validation-report.json | jq '.summary'

# View only errors
cat ./logs/frontend-backend-validation-report.json | jq '.errors'
```

**⚠️ NOTE:** This validation system was created after the payment setup failure caused by service type mismatch between frontend (`"60min"`) and backend (`"60min_massage"`). It will prevent similar integration issues in the future.