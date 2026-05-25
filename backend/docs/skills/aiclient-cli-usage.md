---
name: aiclient-cli-usage
description: Use when an agent needs to understand, configure, or call the AIClient2API service via its CLI tools or REST APIs.
---

# AIClient2API CLI & API Usage Skill

## Overview
This skill provides instructions for AI agents to interact with the AIClient2API service. It covers how to discover available commands and navigate the exhaustive API surface using both local CLI and remote REST interfaces.

## Self-Discovery Modes

**CRITICAL**: Regardless of how you access the service, using REST APIs (for management or AI tasks) requires the `Server Address` and appropriate credentials. **Always ask the user for the `Server Address` (use `http://localhost:3000` as default for local) and `Admin Password` before attempting API-based tasks.**

### 1. Local Mode (CLI & REST API)
Use these when you have shell access to the server environment. In this mode, you can use both local CLI tools and REST APIs:
- **CLI Help**: `npm run help` (Add `--json` for structured data)
- **CLI API Guide**: `npm run example:api` (Add `--json` for structured data)
- **REST API**: You can access all endpoints via `http://localhost:<PORT>` (Default: 3000).

### 2. Remote Mode (REST API Only)
Use these when interacting with a running instance over the network without shell access:
- **Help JSON**: `GET <SERVER_ADDR>/api/help` (Public, No Auth)
- **API Guide JSON**: `GET <SERVER_ADDR>/api/example` (Public, No Auth)
- **REST API**: Use the user-provided `Server Address`.

## When to Use
- When you need to understand, configure, or call the AIClient2API service.
- To programmatically manage model providers or account pools.
- To monitor system health, logs, or usage.

## Core API Categories (AI vs. Management)

### 0. Public Endpoints (No Auth Required)
Use these for self-discovery or system monitoring:
- `GET /api/help`: Get full API help documentation (JSON).
- `GET /api/example`: Get API calling examples (JSON).
- `GET /provider_health`: Detailed health status of all model providers.
- `POST /api/login`: Exchange `Admin Password` for a dynamic `Token`.

### 1. AI Business Path (`/v1/*`, `/v1beta/*`, `/count_tokens`)
- **Purpose**: AI model inference (chat, image, token counting).
- **Auth**: Static `API Key`. **Ask the user for this if not provided.**
- **Header**: `Authorization: Bearer <YOUR_API_KEY>`

### 2. Management Path (`/api/*`, `/health`, `/provider_health`)
- **Purpose**: Server config, node pool management, logs, stats.
- **Auth**: Dynamic `Token` via `/api/login`. **Ask the user for the `Server Address` and `Admin Password`.**
- **Header**: `Authorization: Bearer <ADMIN_TOKEN>` (Except for `/api/login` and public health checks).

## Advanced Patterns

### Path Routing
Force a specific provider by prefixing the AI business path:
- `/gemini-cli-oauth/v1/chat/completions`
- `/claude-custom/v1/messages`

### Real-time Logs (SSE)
Subscribe to `GET /api/events` via `EventSource` for live system output.

## Quick Reference

| Mode | Method | Command/Endpoint | Format |
|------|--------|------------------|--------|
| Local | CLI | `npm run help -- --json` | JSON |
| Local | CLI | `npm run example:api` | Text |
| Local | REST | `GET http://localhost:3000/api/help` | JSON |
| Remote | REST | `GET <SERVER_ADDR>/api/help` | JSON |
| Remote | REST | `GET <SERVER_ADDR>/api/example?format=text` | Text |

## Common Mistakes
- **Wrong Key**: Using the static AI Key for management APIs (causes 401).
- **No Login**: Attempting to fetch `/api/config` without first calling `/api/login`.
- **Format Mismatch**: Expecting JSON from a CLI command without the `--json` flag.

## Code Example: Management API Flow
```javascript
// 1. Login to get token
const login = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ password: 'admin' })
});
const { token } = await login.json();

// 2. Use token for management
const nodes = await fetch('/api/providers', {
    headers: { 'Authorization': `Bearer ${token}` }
});
```
