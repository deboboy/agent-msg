const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'agent-msg');
const MSG_DIR = path.join(os.homedir(), '.agent-msg');
const INBOX_DIR = path.join(MSG_DIR, 'inbox');
const AGENTS_FILE = path.join(MSG_DIR, 'agents.json');

function run(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [CLI, ...args], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    
    proc.on('close', code => resolve({ code, stdout, stderr }));
    proc.on('error', reject);
  });
}

function cleanup() {
  if (fs.existsSync(MSG_DIR)) {
    fs.rmSync(MSG_DIR, { recursive: true, force: true });
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function testRegister() {
  console.log('Test: register...');
  const result = await run(['register', 'test-agent-1', '-t', 'open-code']);
  if (result.code !== 0) {
    console.error('STDERR:', result.stderr);
    console.error('STDOUT:', result.stdout);
  }
  assert(result.code === 0, `Expected exit 0, got ${result.code}`);
  assert(result.stdout.includes('Registered agent: test-agent-1'), 'Should confirm registration');
  
  const agents = JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
  assert(agents['test-agent-1'], 'Agent should be in registry');
  assert(agents['test-agent-1'].type === 'open-code', 'Agent type should be set');
  console.log('  ✓ register works');
}

async function testList() {
  console.log('Test: list...');
  const result = await run(['list']);
  assert(result.code === 0);
  assert(result.stdout.includes('test-agent-1'));
  console.log('  ✓ list works');
}

async function testSend() {
  console.log('Test: send (file-based)...');
  const result = await run(['send', 'test-agent-1', 'Hello from test-agent-2']);
  assert(result.code === 0);
  assert(result.stdout.includes('Message sent'));
  
  const inboxPath = path.join(INBOX_DIR, 'test-agent-1');
  const files = fs.readdirSync(inboxPath).filter(f => f.endsWith('.json'));
  assert(files.length === 1, 'Should have 1 message');
  
  const msg = JSON.parse(fs.readFileSync(path.join(inboxPath, files[0]), 'utf8'));
  assert(msg.message === 'Hello from test-agent-2', 'Message content should match');
  console.log('  ✓ send works');
}

async function testInbox() {
  console.log('Test: inbox...');
  
  fs.writeFileSync(path.join(INBOX_DIR, 'test-agent-1', 'test-msg.json'), JSON.stringify({
    id: 'test-msg',
    from: 'test-agent-2',
    to: 'test-agent-1',
    message: 'Test message',
    timestamp: new Date().toISOString()
  }));
  
  const result = await run(['inbox', 'test-agent-1']);
  assert(result.code === 0);
  assert(result.stdout.includes('Test message'), 'Should show message');
  console.log('  ✓ inbox works');
}

async function testPing() {
  console.log('Test: ping (server not running - should fail gracefully)...');
  const result = await run(['ping', 'nonexistent-agent']);
  assert(result.code !== 0 || result.stdout.includes('offline'), 'Should indicate offline');
  console.log('  ✓ ping handles offline gracefully');
}

async function testHelp() {
  console.log('Test: --help...');
  const result = await run(['--help']);
  assert(result.code === 0);
  assert(result.stdout.includes('register'));
  assert(result.stdout.includes('send'));
  assert(result.stdout.includes('inbox'));
  assert(result.stdout.includes('server'));
  assert(result.stdout.includes('connect'));
  assert(result.stdout.includes('ping'));
  console.log('  ✓ help shows all commands');
}

async function runTests() {
  console.log('\n=== agent-msg Tests ===\n');
  
  cleanup();
  
  try {
    await testRegister();
    await testList();
    await testSend();
    await testInbox();
    await testPing();
    await testHelp();
    
    console.log('\n✓ All tests passed!\n');
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    process.exit(1);
  } finally {
    cleanup();
  }
}

runTests();
