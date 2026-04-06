const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

/**
 * Helper to fire HTTP requests
 */
const sendRequest = (method, path, body = null, ip = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Spoof IPs to trigger diverse rules without affecting local tests
        if (ip) {
            options.headers['x-forwarded-for'] = ip;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runSimulations() {
    console.log('🛡️  LogSentinel Automated Attack Simulator\n');

    // 1. Brute Force (Multiple failed logins from same IP)
    console.log('--> \x1b[33mTriggering Brute Force (Multiple failed logins from same IP)...\x1b[0m');
    for (let i = 0; i < 6; i++) {
        await sendRequest('POST', '/api/v1/auth/login', { username: 'admin', password: 'bad' }, '10.0.0.1');
        await wait(100);
    }
    console.log('    Done. (10.0.0.1 tried logging into admin 6 times)\n');

    // 2. Credential Stuffing (Multiple unique account login failures)
    console.log('--> \x1b[33mTriggering Credential Stuffing (Multiple account login failures from 1 IP)...\x1b[0m');
    const users = ['john', 'maria', 'test', 'sysadmin', 'root', 'user1', 'guest'];
    for (const u of users) {
        await sendRequest('POST', '/api/v1/auth/login', { username: u, password: 'password123' }, '10.0.0.2');
        await wait(100);
    }
    console.log('    Done. (10.0.0.2 sprayed multiple accounts)\n');

    // 3. Compromise (Fail then Success)
    console.log('--> \x1b[33mTriggering Account Compromise (Multiple Fails -> Sudden Success)...\x1b[0m');
    for (let i = 0; i < 4; i++) {
        await sendRequest('POST', '/api/v1/auth/login', { username: 'admin', password: 'bad' }, '10.0.0.3');
        await wait(100);
    }
    await sendRequest('POST', '/api/v1/auth/login', { username: 'admin', password: 'admin123' }, '10.0.0.3'); // Success
    console.log('    Done. (10.0.0.3 failed 4 times, then got correct password)\n');

    // 4. Request Abuse (Aggressive probing)
    console.log('--> \x1b[33mTriggering Request Abuse (Aggressive probing on protected endpoints)...\x1b[0m');
    for (let i = 0; i < 15; i++) {
        await sendRequest('GET', '/api/v1/admin', null, '10.0.0.4');
        await wait(50);
    }
    console.log('    Done. (10.0.0.4 scanned /admin 15 times rapidly)\n');

    console.log('\n✅ All attack vectors executed!');
    console.log('Open Postman and watch your Server-Sent-Events stream go wild!');
}

runSimulations();
