const { execSync } = require('child_process');

function fixFirewall() {
    console.log('🛡️  Fixing Windows Firewall for Mobile Connectivity...');
    
    try {
        // 1. Delete existing rules for port 5000 to avoid duplicates
        console.log('🗑️  Clearing old rules...');
        try { execSync('netsh advfirewall firewall delete rule name="Rice Mill Backend (5000)"', { stdio: 'ignore' }); } catch(e) {}

        // 2. Add rule for all network types (Public and Private)
        console.log('✅ Adding new rule for Port 5000 (All Networks)...');
        execSync('netsh advfirewall firewall add rule name="Rice Mill Backend (5000)" dir=in action=allow protocol=TCP localport=5000');
        
        // 3. Specifically allow node.exe
        console.log('✅ Allowing Node.js application traffic...');
        execSync('netsh advfirewall firewall add rule name="Rice Mill Node" dir=in action=allow program="' + process.execPath + '"');

        console.log('\n✨ FIREWALL FIXED! ✨');
        console.log('Your laptop will now allow the phone to connect over your hotspot.');
    } catch (err) {
        console.error('\n❌ FAILED to fix firewall. Please run as Administrator.');
        console.log('Error: ' + err.message);
    }
}

fixFirewall();
