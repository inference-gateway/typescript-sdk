# MCP Examples

This directory contains comprehensive examples demonstrating how to use the Inference Gateway SDK with Model Context Protocol (MCP) tools in a multi-provider architecture. Each example showcases different aspects of MCP tool integration.

## 🚀 Quick Start

### Run Specific Examples

```bash
# Run interactive specialized agents
docker compose -f docker-compose-agents.yml run --rm -it nextjs-agent      # 🤖 Next.js development agent
docker compose -f docker-compose-agents.yml run --rm -it vite-agent        # ⚡ Vite application agent
docker compose -f docker-compose-agents.yml run --rm -it kubernetes-agent  # ☸️ Kubernetes operations agent
```

## 🧠 Memory & Error Recovery

The **Memory MCP Server** provides persistent state management for AI agents, enabling them to recover gracefully from HTTP errors and continue from where they left off. This is particularly useful for long-running tasks that may encounter temporary network issues or API failures.

### Key Features

- **State Persistence**: Save arbitrary state objects with session IDs
- **Error State Recovery**: Special handling for HTTP error scenarios
- **Session Management**: List, restore, and clear saved sessions
- **File-based Storage**: Persistent storage using JSON files

### Memory Tools Integration

All agents (Next.js, Vite, and Kubernetes) now include memory recovery capabilities:

1. **Save State Before Risky Operations**: Before making HTTP requests, agents save their current progress
2. **Handle Errors Gracefully**: When HTTP errors occur, agents save the error state with context
3. **Resume from Last Checkpoint**: On restart, agents check for saved state and continue from the last successful step
4. **Memory Management**: Agents can list, restore, and clear saved sessions

### Available Memory Tools

- `save-state`: Save current progress/state with a session ID
- `save-error-state`: Save state when HTTP errors occur for recovery
- `restore-state`: Restore previously saved state by session ID
- `list-sessions`: List all saved sessions
- `clear-session`: Remove a saved session

All agents will automatically use these tools when encountering HTTP errors, ensuring robust error recovery and task continuation.
