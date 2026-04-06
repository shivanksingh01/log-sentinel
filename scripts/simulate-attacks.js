const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT) || 5000;
const HOST = 'localhost';

// ─── Colors ───────────────────────────────────────────────────────────────────
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(color, prefix, msg) {
    console.log(`  ${color}[${prefix}]${c.reset} ${msg}`);
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Fire a single HTTP request to the local LogSentinel API.
 */
const request = (method, urlPath, body = null, ip = null, userAgent = null) => {
    return new Promise((resolve) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: urlPath,
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (ip) options.headers['x-forwarded-for'] = ip;
        if (userAgent) options.headers['user-agent'] = userAgent;

        const req = http.request(options, (res) => {
            res.resume();
            resolve(res.statusCode);
        });
        req.on('error', () => resolve(0));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

/**
 * Directly write a crafted log line to /logs/app.log.
 * Used to inject attack patterns that bypass the actual API
 * (e.g., scanner probes with suspicious paths for path traversal / SQLi).
 */
const LOG_FILE = path.resolve(process.cwd(), 'logs', 'app.log');
const injectLogLine = (line) => {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf-8');
};

// ─── Scenarios ────────────────────────────────────────────────────────────────

async function scenario_bruteForce() {
    log(c.yellow, 'ATTACK 1', 'Brute Force — Same IP hammers login with wrong passwords...');
    for (let i = 0; i < 12; i++) {
        await request('POST', '/api/v1/auth/login', { username: 'admin', password: `wrong${i}` }, '192.168.1.10');
        await wait(80);
    }
    log(c.green, 'DONE', 'Brute Force sent (12 attempts from 192.168.1.10) — expect MEDIUM then HIGH alert\n');
}

async function scenario_credentialStuffing() {
    log(c.yellow, 'ATTACK 2', 'Credential Stuffing — One IP tries many different usernames...');
    const users = ['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'heidi', 'ivan'];
    for (const u of users) {
        await request('POST', '/api/v1/auth/login', { username: u, password: 'password123' }, '192.168.1.20');
        await wait(80);
    }
    log(c.green, 'DONE', 'Credential Stuffing sent (9 unique accounts from 192.168.1.20)\n');
}

async function scenario_distributedAttack() {
    log(c.yellow, 'ATTACK 3', 'Distributed Attack — Many IPs targeting the same account...');
    const ips = ['10.0.1.1', '10.0.1.2', '10.0.1.3', '10.0.1.4', '10.0.1.5', '10.0.1.6'];
    for (const ip of ips) {
        await request('POST', '/api/v1/auth/login', { username: 'root', password: 'wrongpass' }, ip);
        await wait(100);
    }
    log(c.green, 'DONE', 'Distributed Attack sent (6 IPs targeting account "root")\n');
}

async function scenario_compromise() {
    log(c.yellow, 'ATTACK 4', 'Account Compromise — Fail then Succeed (brute force success)...');
    for (let i = 0; i < 4; i++) {
        await request('POST', '/api/v1/auth/login', { username: 'admin', password: `wrong${i}` }, '192.168.1.30');
        await wait(80);
    }
    await request('POST', '/api/v1/auth/login', { username: 'admin', password: 'admin123' }, '192.168.1.30');
    log(c.green, 'DONE', 'Compromise sent (4 failures + 1 success from 192.168.1.30) — expect HIGH POSSIBLE_COMPROMISE alert\n');
}

async function scenario_requestAbuse() {
    log(c.yellow, 'ATTACK 5', 'Request Abuse / DDoS — Flooding requests to all endpoints...');
    for (let i = 0; i < 110; i++) {
        await request('GET', '/api/v1/products', null, '192.168.1.40');
        if (i % 20 === 0) await wait(10);
    }
    log(c.green, 'DONE', 'Request Abuse sent (110 rapid requests from 192.168.1.40)\n');
}

async function scenario_scannerBot() {
    log(c.yellow, 'ATTACK 6', 'Scanner / Bot Detection — Probing many distinct paths rapidly...');
    const paths = [
        '/admin', '/wp-admin', '/phpinfo.php', '/config.php', '/.env', '/backup',
        '/.git/config', '/server-status', '/actuator/health', '/api/debug',
        '/admin/config', '/db/backup', '/shell.php', '/setup.php'
    ];
    for (const p of paths) {
        await request('GET', `/api/v1${p}`, null, '192.168.1.50', 'Nikto/2.1.6');
        await wait(30);
    }
    log(c.green, 'DONE', 'Scanner probe sent (14 distinct paths from 192.168.1.50 @ Nikto UA)\n');
}

async function scenario_forbiddenProbe() {
    log(c.yellow, 'ATTACK 7', 'Forbidden Access Probing — Repeatedly hitting protected /admin...');
    for (let i = 0; i < 8; i++) {
        await request('GET', '/api/v1/admin', null, '192.168.1.60');
        await wait(100);
    }
    log(c.green, 'DONE', 'Forbidden Probe sent (8x /admin 403 from 192.168.1.60)\n');
}

async function scenario_pathTraversal() {
    log(c.yellow, 'ATTACK 8', 'Path Traversal — Injecting traversal sequences into log...');
    const now = new Date().toISOString();
    const attackIp = '192.168.1.70';
    const traversalPaths = [
        '/api/v1/files/../../../etc/passwd',
        '/api/v1/download?file=..%2F..%2F..%2Fetc%2Fshadow',
        '/api/v1/static/../../../../windows/system32/config/sam'
    ];
    for (const p of traversalPaths) {
        injectLogLine(`${now} event=REQUEST ip=${attackIp} path=${p} status=400 method=GET`);
        await wait(50);
    }
    log(c.green, 'DONE', 'Path Traversal sequences injected directly into app.log (192.168.1.70)\n');
}

async function scenario_sqliProbe() {
    log(c.yellow, 'ATTACK 9', 'SQL Injection Probe — Injecting SQLi patterns into log...');
    const now = new Date().toISOString();
    const attackIp = '192.168.1.80';
    const sqliPaths = [
        "/api/v1/products?id=1' OR 1=1--",
        "/api/v1/users?name=' UNION SELECT username,password FROM users--",
        '/api/v1/search?q=1; DROP TABLE users;--',
        "/api/v1/auth/login?redirect=' AND sleep(5)--"
    ];
    for (const p of sqliPaths) {
        injectLogLine(`${now} event=REQUEST ip=${attackIp} path=${encodeURIComponent(p)} status=400 method=GET`);
        await wait(50);
    }
    log(c.green, 'DONE', 'SQL Injection probes injected directly into app.log (192.168.1.80)\n');
}

async function scenario_highErrorRate() {
    log(c.yellow, 'ATTACK 10', 'High Error Rate — Fuzzer generating constant 4xx errors...');
    const paths = ['/not-exist', '/api/unknown', '/v0/missing', '/broken'];
    for (let i = 0; i < 20; i++) {
        await request('GET', paths[i % paths.length], null, '192.168.1.90');
        await wait(50);
    }
    log(c.green, 'DONE', 'High Error Rate sent (20 404/403 responses from 192.168.1.90)\n');
}

// ─── Main Runner ──────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n${c.bold}${c.cyan}╔══════════════════════════════════════════════════╗`);
    console.log(`  🛡️  LogSentinel Full Attack Simulation Suite`);
    console.log(`  Host: ${HOST}:${PORT}`);
    console.log(`╚══════════════════════════════════════════════════╝${c.reset}\n`);
    console.log(`${c.blue}  Ensure your server is running: npm start${c.reset}\n`);
    console.log(`  Running ${c.bold}10 distinct attack scenarios${c.reset}...\n`);

    await scenario_bruteForce();
    await scenario_credentialStuffing();
    await scenario_distributedAttack();
    await scenario_compromise();
    await scenario_requestAbuse();
    await scenario_scannerBot();
    await scenario_forbiddenProbe();
    await scenario_pathTraversal();
    await scenario_sqliProbe();
    await scenario_highErrorRate();

    console.log(`${c.bold}${c.green}✅ All 10 attack scenarios executed!${c.reset}`);
    console.log(`\n  Check your logs or open Postman SSE stream to see all alerts.`);
    console.log(`  ${c.cyan}GET http://${HOST}:${PORT}/api/v1/alerts/summary${c.reset}\n`);
}

main().catch(err => {
    console.error(`${c.red}[ERROR]${c.reset} Simulation failed: ${err.message}`);
    process.exit(1);
});
