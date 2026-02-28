# Changelog

All notable changes to agent-msg are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-02-28

### Added
- Initial release of agent-msg
- `register` command to register a named agent with an optional type (`claude-code`, `open-code`, `codex`, `openclaw`, `other`)
- `list` command to display all registered agents
- `send` command for file-based message delivery between agents
- `send -w --wait` for WebSocket delivery with confirmation
- `inbox` command to retrieve new messages (deletes after reading)
- `poll` command for continuous message monitoring with configurable interval
- `server` command to start the WebSocket server (default port 18790)
- `connect` command to join the WebSocket server as a named agent
- `ping` command to check if an agent is online via WebSocket
- Programmatic API via `AgentMessenger` class
- Support for `-u / --url` flag to target a remote WebSocket server
- Unit test suite (`npm test`) covering register, list, send, inbox, ping, and help

### Documentation
- README with Quick Start, Commands, Options, and Example Workflow
- VPS deployment guide covering installation, firewall setup, PM2 and systemd service configuration, and remote agent connections
- Security & Authentication guide covering SSH tunneling, nginx reverse proxy with TLS and token auth, and IP allowlisting
- [TEST_RESULTS.md](TEST_RESULTS.md) with verified test results for all transports and scenarios

---

[1.0.0]: https://github.com/deboboy/agent-msg/releases/tag/v1.0.0
