# MCP Examples

This directory contains comprehensive examples demonstrating how to use the Inference Gateway SDK with Model Context Protocol (MCP) tools in a multi-provider architecture. Each example showcases different aspects of MCP tool integration.

## 🚀 Quick Start

### Run Specific Examples

```bash
# Run interactive specialized agents
docker compose -f docker-compose-agents.yml run --rm nextjs-agent      # 🤖 Next.js development agent
docker compose -f docker-compose-agents.yml run --rm vite-agent        # ⚡ Vite application agent
docker compose -f docker-compose-agents.yml run --rm kubernetes-agent  # ☸️ Kubernetes operations agent
```
