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