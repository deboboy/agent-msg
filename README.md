# agent-msg

Inter-agent communication utility for AI agents (Claude Code, Open Code, Codex, OpenClaw). Enables agents to message each other without copy-pasting between CLI sessions.

## Why?

When running multiple AI agents in separate terminal sessions, there's no built-in way for them to communicate. This utility provides a simple message passing system so agents can collaborate on tasks.

## Installation

```bash
npm install -g agent-msg
```

Or clone and install locally:

```bash
git clone <repo-url> agent-msg
cd agent-msg
npm install
npm link
```

## Testing

### Unit Tests
```bash
npm test
```

### Manual WebSocket Testing

Test real-time messaging between agents:

**Terminal 1 - Start server:**
```bash
agent-msg server
```

**Terminal 2 - Connect agent A:**
```bash
agent-msg connect -a agent-a
```

**Terminal 3 - Connect agent B:**
```bash
agent-msg connect -a agent-b
```

**In agent B terminal, send a message:**
```
agent-a Hello from agent B!
```

Agent A should receive the message instantly.

## Quick Start

1. **Register each agent:**
   ```bash
   agent-msg register claude-desktop -t claude-code
   agent-msg register opencode-session -t open-code
   agent-msg register codex-agent -t codex
   agent-msg register openclaw-bot -t openclaw
   ```

2. **List registered agents:**
   ```bash
   agent-msg list
   ```

3. **Send a message:**
   ```bash
   agent-msg send opencode-session "Hey, can you check the test results?"
   ```

4. **Check inbox:**
   ```bash
   agent-msg inbox
   ```

5. **Poll for messages continuously:**
   ```bash
   agent-msg poll
   ```

## Commands

| Command | Description |
|---------|-------------|
| `agent-msg register [name]` | Register this agent |
| `agent-msg list` | List registered agents |
| `agent-msg send <to> <message>` | Send a message (file-based) |
| `agent-msg send <to> <message> -w` | Send via WebSocket with delivery confirmation |
| `agent-msg inbox [agent]` | Check for new messages |
| `agent-msg poll [agent]` | Continuously poll for messages |
| `agent-msg server` | Start WebSocket server |
| `agent-msg connect` | Connect to WebSocket server as agent |
| `agent-msg ping <agent>` | Check if agent is online |

## Options

- `-t, --type <type>` - Agent type (claude-code, open-code, codex, openclaw, other)
- `-a, --all` - Show all inbox messages instead of just new ones
- `-i, --interval <ms>` - Polling interval (default: 2000ms)
- `-p, --port <port>` - WebSocket server port (default: 18790)
- `-u, --url <url>` - WebSocket server URL
- `-w, --websocket` - Use WebSocket messaging
- `-s, --from <name>` - Sender agent name
- `--wait` - Wait for delivery confirmation

## Running on a VPS

A VPS makes the WebSocket server accessible to agents running on different machines, enabling cross-device agent collaboration.

### Prerequisites

- Node.js v18+ and npm
- A VPS with a public IP address
- Port 18790 open (or your chosen port)

### 1. Install agent-msg on the VPS

```bash
npm install -g agent-msg
```

### 2. Open the firewall port

**ufw (Ubuntu/Debian):**
```bash
sudo ufw allow 18790/tcp
```

**firewalld (CentOS/RHEL):**
```bash
sudo firewall-cmd --permanent --add-port=18790/tcp
sudo firewall-cmd --reload
```

**iptables:**
```bash
sudo iptables -A INPUT -p tcp --dport 18790 -j ACCEPT
```

### 3. Start the WebSocket server

For a quick test:
```bash
agent-msg server
```

For persistent operation, use [PM2](https://pm2.keymetrics.io/):
```bash
npm install -g pm2
pm2 start "agent-msg server" --name agent-msg-server
pm2 save
pm2 startup   # auto-start on reboot
```

Or run as a systemd service:
```bash
sudo tee /etc/systemd/system/agent-msg.service > /dev/null <<EOF
[Unit]
Description=agent-msg WebSocket Server
After=network.target

[Service]
ExecStart=$(which agent-msg) server
Restart=always
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now agent-msg
```

### 4. Connect agents remotely

On each remote machine, install agent-msg and connect using the `-u` flag with your VPS IP or hostname:

```bash
npm install -g agent-msg

agent-msg register my-agent -t claude-code
agent-msg connect -a my-agent -u ws://YOUR_VPS_IP:18790
```

### 5. Send messages across machines

With agents connected from different machines, sending works the same way — just add `-u` to target the remote server:

```bash
agent-msg send other-agent "Hello from a different machine!" -w --wait -u ws://YOUR_VPS_IP:18790
```

### Example: Claude Code on one machine, OpenCode on another

**VPS — start the server:**
```bash
agent-msg server
```

**Machine A (OpenCode):**
```bash
agent-msg register opencode-agent -t open-code
agent-msg connect -a opencode-agent -u ws://YOUR_VPS_IP:18790
```

**Machine B (Claude Code):**
```bash
agent-msg register claude-code-agent -t claude-code
agent-msg send opencode-agent "Can you run the tests?" -w --wait -u ws://YOUR_VPS_IP:18790
```

OpenCode on Machine A receives the message in real time.

### Security note

Port 18790 is unauthenticated by default. For production use, consider placing the WebSocket server behind a reverse proxy (nginx, Caddy) with TLS and access controls.

---

## Programmatic Usage

```javascript
const { AgentMessenger } = require('agent-msg');

const agent = new AgentMessenger('my-agent');

// Send a message
agent.send('other-agent', 'Hello from my agent!');

// Check inbox
const messages = agent.checkInbox();
messages.forEach(msg => console.log(msg.message));
```

## How It Works

### File-Based Messaging
Messages are stored in `~/.agent-msg/outbox/<recipient>/` and read from `~/.agent-msg/inbox/<agent-name>/`. Simple and reliable for inter-process communication.

### WebSocket Messaging
Start a server with `agent-msg server` and agents can connect for real-time bidirectional communication.

## Example Workflow

**Terminal 1 (OpenCode):**
```bash
agent-msg register opencode -t open-code
agent-msg poll
```

**Terminal 2 (Claude Code):**
```bash
agent-msg register claude -t claude-code
agent-msg send opencode "Can you run the tests?"
```

OpenCode will receive the message instantly when polling.
