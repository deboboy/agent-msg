const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocket } = require('ws');

const MSG_DIR = path.join(os.homedir(), '.agent-msg');

class AgentMessenger {
  constructor(agentName) {
    this.agentName = agentName;
    this.inboxDir = path.join(MSG_DIR, 'inbox', agentName);
    this.outboxDir = path.join(MSG_DIR, 'outbox', agentName);
    this.ws = null;
  }

  ensureDirs() {
    [this.inboxDir, this.outboxDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  send(to, message) {
    this.ensureDirs();
    const msg = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      from: this.agentName,
      to,
      message,
      timestamp: new Date().toISOString()
    };
    const inboxFile = path.join(MSG_DIR, 'inbox', to, `${msg.id}.json`);
    fs.writeFileSync(inboxFile, JSON.stringify(msg, null, 2));
    return msg.id;
  }

  checkInbox(deleteAfterRead = true) {
    this.ensureDirs();
    if (!fs.existsSync(this.inboxDir)) return [];
    
    const files = fs.readdirSync(this.inboxDir).filter(f => f.endsWith('.json'));
    const messages = files.map(file => {
      const msg = JSON.parse(fs.readFileSync(path.join(this.inboxDir, file), 'utf8'));
      if (deleteAfterRead) {
        fs.unlinkSync(path.join(this.inboxDir, file));
      }
      return msg;
    });
    return messages;
  }

  async connectWebSocket(url) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      this.ws.on('open', () => resolve());
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          this.handleMessage(msg);
        } catch (e) {}
      });
    });
  }

  handleMessage(msg) {
    console.log(`[${msg.from}]: ${msg.message}`);
  }

  sendWebSocket(to, message) {
    if (!this.ws) throw new Error('Not connected to WebSocket');
    this.ws.send(JSON.stringify({
      type: 'message',
      from: this.agentName,
      to,
      message,
      timestamp: new Date().toISOString()
    }));
  }
}

module.exports = { AgentMessenger };
