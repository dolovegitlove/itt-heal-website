// Find exact JavaScript syntax error location
const fs = require('fs');

const html = fs.readFileSync('admin-dashboard.html', 'utf8');

// Extract JavaScript content more carefully
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>');

if (scriptStart === -1 || scriptEnd === -1) {
    console.log('No script tags found');
    process.exit(1);
}

const jsContent = html.substring(scriptStart + 8, scriptEnd);

// Save to temp file
fs.writeFileSync('/tmp/extracted_js_careful.js', jsContent);

console.log('JavaScript extracted to /tmp/extracted_js_careful.js');
console.log('Length:', jsContent.length, 'characters');

// Test with Node.js syntax check
const { exec } = require('child_process');
exec('node -c /tmp/extracted_js_careful.js', (error, stdout, stderr) => {
    if (error) {
        console.log('❌ SYNTAX ERROR:');
        console.log(stderr);
        
        // Find the problematic line
        const lines = jsContent.split('\n');
        const errorMatch = stderr.match(/^.*:(\d+)/);
        if (errorMatch) {
            const lineNum = parseInt(errorMatch[1]);
            console.log('\n🔍 Problem area:');
            for (let i = Math.max(0, lineNum - 3); i <= Math.min(lines.length - 1, lineNum + 3); i++) {
                const marker = i === lineNum - 1 ? '>>> ' : '    ';
                console.log(`${marker}${i + 1}: ${lines[i]}`);
            }
        }
    } else {
        console.log('✅ JavaScript syntax is valid');
    }
});