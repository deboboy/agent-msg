# agent-msg

Inter-agent communication utility for AI agents (Claude Code, Open Code, Codex, OpenClaw). Enables agents to message each other without copy-pasting between CLI sessions.

[Changelog](CHANGELOG.md)

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

See [TEST_RESULTS.md](TEST_RESULTS.md) for full test results including WebSocket and integration tests.

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

---

## Security & Authentication

The WebSocket server has no built-in authentication. Choose an approach below based on your threat model.

### Option 1: SSH Tunnel (simplest, recommended for personal use)

Keep port 18790 closed to the public. Agents connect over an encrypted SSH tunnel instead.

**On the VPS — bind the server to localhost only:**
```bash
agent-msg server  # listens on 127.0.0.1:18790 by default
```

Block external access:
```bash
sudo ufw deny 18790/tcp
```

**On each remote machine — open a tunnel before connecting:**
```bash
ssh -L 18790:127.0.0.1:18790 user@YOUR_VPS_IP -N &
agent-msg connect -a my-agent -u ws://127.0.0.1:18790
```

All traffic is encrypted via SSH. No credentials are exposed over the network.

---

### Option 2: Reverse Proxy with TLS + Token Auth (recommended for teams)

Place nginx in front of the WebSocket server with HTTPS and a shared secret header.

**Install nginx and obtain a certificate (via Let's Encrypt):**
```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**nginx config (`/etc/nginx/sites-available/agent-msg`):**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location /agent-msg {
        # Require a shared secret token in the request header
        if ($http_x_agent_token != "YOUR_SECRET_TOKEN") {
            return 403;
        }

        proxy_pass http://127.0.0.1:18790;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/agent-msg /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Agents connect using the secure URL and token header:**
```bash
agent-msg connect -a my-agent -u wss://your-domain.com/agent-msg \
  --header "x-agent-token: YOUR_SECRET_TOKEN"
```

Traffic is encrypted (WSS) and unauthenticated connections are rejected with 403.

---

### Option 3: IP Allowlist (simple for fixed-IP environments)

If your agents always run from known IP addresses, restrict access at the firewall level.

**ufw:**
```bash
sudo ufw deny 18790/tcp
sudo ufw allow from AGENT_IP_1 to any port 18790
sudo ufw allow from AGENT_IP_2 to any port 18790
```

**iptables:**
```bash
iptables -A INPUT -p tcp --dport 18790 -s AGENT_IP_1 -j ACCEPT
iptables -A INPUT -p tcp --dport 18790 -s AGENT_IP_2 -j ACCEPT
iptables -A INPUT -p tcp --dport 18790 -j DROP
```

---

### Comparison

| Approach | Encryption | Auth | Best for |
|----------|-----------|------|----------|
| SSH tunnel | ✓ (SSH) | ✓ (SSH keys) | Personal / solo use |
| Reverse proxy + TLS | ✓ (TLS) | ✓ (token) | Teams / shared servers |
| IP allowlist | ✗ | Partial (IP) | Fixed-IP private networks |

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
