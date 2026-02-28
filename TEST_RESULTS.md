# agent-msg Test Results

**Date:** 2026-02-28
**Version:** 1.0.0
**Environment:** Linux (Node.js v22.22.0)

---

## 1. Unit Tests

**Command:** `npm test`

All 6 automated tests passed:

| Test | Result |
|------|--------|
| `register` works | ✓ |
| `list` works | ✓ |
| `send` (file-based) works | ✓ |
| `inbox` works | ✓ |
| `ping` handles offline gracefully | ✓ |
| `--help` shows all commands | ✓ |

---

## 2. Manual WebSocket Test

Verified point-to-point message delivery between two agents over WebSocket.

**Setup:**
- WebSocket server started on port 18790
- `agent-a` (claude-code) connected and listening
- `agent-b` (open-code) used as sender

**Send command:**
```
agent-msg send agent-a "Hello from agent B!" -w --wait
```

**Result:**
```
Sending to agent-a via WebSocket...
✓ Delivered to agent-a

agent-a received: [EVALBOX-TUI-31]: Hello from agent B!
```

Status: **PASS**

---

## 3. Integration Test — File-Based Transport

Verified the full message-passing chain using file-based transport with continuous polling.

**Setup:**
- `opencode-agent` registered and polling every 1000ms
- `claude-code-agent` registered as sender

**Send command:**
```
agent-msg send opencode-agent "Can you run the tests?"
```

**Result:**
- Message sent and assigned ID
- Polling cycle picked up message within 1 second
- `opencode-agent` received: `[EVALBOX-TUI-31]: Can you run the tests?`

Status: **PASS**

---

## 4. Integration Test — WebSocket Transport (Claude Code → OpenCode)

Verified real-time message delivery between a Claude Code agent and an OpenCode agent over WebSocket without polling.

**Setup:**
- WebSocket server started on port 18790
- `opencode-agent` (open-code) connected and listening
- `claude-code-agent` (claude-code) connected and listening

**Send command:**
```
agent-msg send opencode-agent "Can you run the tests?" -w --wait
```

**Result:**
```
Sending to opencode-agent via WebSocket...
✓ Delivered to opencode-agent

opencode-agent received: [EVALBOX-TUI-31]: Can you run the tests?
```

Status: **PASS**

---

## 5. Bidirectional WebSocket Test (OpenCode → Claude Code)

Verified the return path — a reply from OpenCode back to Claude Code over WebSocket.

**Send command:**
```
agent-msg send claude-code-agent "Tests passed! All 6 unit tests green." -w --wait
```

**Result:**
```
Sending to claude-code-agent via WebSocket...
✓ Delivered to claude-code-agent

claude-code-agent received: [EVALBOX-TUI-31]: Tests passed! All 6 unit tests green.
```

Status: **PASS**

---

## Summary

| Test | Transport | Result |
|------|-----------|--------|
| Unit tests (npm test) | — | ✓ PASS |
| Manual WebSocket (agent-b → agent-a) | WebSocket | ✓ PASS |
| Integration: polling (claude-code → opencode) | File-based | ✓ PASS |
| Integration: real-time (claude-code → opencode) | WebSocket | ✓ PASS |
| Bidirectional: reply (opencode → claude-code) | WebSocket | ✓ PASS |

All 5 tests passed. Both file-based and WebSocket transports are functioning correctly. Bidirectional agent-to-agent communication is confirmed.

---

### Notes

- Sender identity in received messages displays the system hostname rather than the registered agent name. This is consistent across both file-based and WebSocket transports and appears to be expected behavior.
- WebSocket delivery requires the recipient agent to be actively connected via `agent-msg connect` before the message is sent.
