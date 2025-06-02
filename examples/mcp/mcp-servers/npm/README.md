# MCP NPM Server

A Model Context Protocol (MCP) server that provides safe npm command execution capabilities.

## Features

- **Whitelisted Commands**: Only allows execution of pre-approved npm commands for security
- **Directory Restrictions**: Commands can only be executed in allowed directories
- **Timeout Protection**: Commands are automatically terminated after 5 minutes
- **Process Isolation**: Each command runs in its own process with controlled environment

## Whitelisted NPM Commands

For security, only the following npm commands are allowed:

- `install` - Install packages
- `ci` - Clean install from package-lock.json
- `run` - Run scripts defined in package.json
- `start` - Run the start script
- `build` - Run the build script
- `test` - Run tests
- `lint` - Run linting
- `init` - Initialize a new package.json
- `list` - List installed packages
- `outdated` - Check for outdated packages
- `audit` - Run security audit
- `version` - Show version information
- `view` - View package information
- `search` - Search for packages
- `info` - Show package information

## Available Tools

### npm_run

Execute whitelisted npm commands safely.

**Parameters:**

- `command` (required): The npm command to run
- `args` (optional): Additional arguments for the command
- `workingDir` (optional): Working directory (default: /tmp)

### npm_init_project

Initialize a new npm project in a specified directory.

**Parameters:**

- `projectName` (required): Name of the project to initialize
- `workingDir` (optional): Directory where to create the project (default: /tmp)
- `packageManager` (optional): Package manager to use (default: npm)

### npm_install_package

Install npm packages in a project.

**Parameters:**

- `packages` (required): Array of package names to install
- `workingDir` (optional): Working directory (default: /tmp)
- `saveDev` (optional): Install as dev dependency
- `global` (optional): Install globally (not recommended in containers)

## Environment Variables

- `ALLOWED_DIRECTORIES`: Comma-separated list of allowed directories (default: `/tmp`)
- `PORT`: Server port (default: 3003)
- `NODE_ENV`: Node environment (default: production)

## Example Usage

```bash
# Health check
curl http://localhost:3003/health

# Example MCP request to run npm install
curl -X POST http://localhost:3003/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "npm_run",
      "arguments": {
        "command": "install",
        "args": ["express"],
        "workingDir": "/tmp/my-project"
      }
    }
  }'
```

## Security Considerations

- Only whitelisted npm commands can be executed
- Commands are restricted to allowed directories
- Process timeout prevents hanging operations
- No shell injection vulnerabilities due to controlled argument passing
- Environment variables are controlled and sanitized
