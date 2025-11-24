# MCP Filesystem Server

A Model Context Protocol (MCP) server that provides filesystem operations for
file and directory management.

## Features

- **read_file**: Read the contents of a file
- **write_file**: Write content to a file (creates directories as needed)
- **list_directory**: List the contents of a directory with file information
- **create_directory**: Create new directories (recursive)
- **delete_file**: Delete files safely
- **file_info**: Get detailed information about files and directories

## Security

This server implements directory restrictions to ensure safe file operations:

- Only operates within allowed directories (configurable via `ALLOWED_DIRECTORIES`)
- Validates all paths to prevent directory traversal attacks
- Provides clear error messages for permission issues

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on port 3000 by default. You can change this by setting
the `PORT` environment variable.

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `ALLOWED_DIRECTORIES`: Comma-separated list of allowed directories (default: "/shared,/tmp")
- `NODE_ENV`: Environment (development/production)

### Example Configuration

```bash
export ALLOWED_DIRECTORIES="/shared,/tmp,/workspace/data"
export PORT=3000
npm start
```

## API Endpoints

### Server Information

```text
GET /mcp
```

Returns server capabilities and metadata.

### List Tools

```text
POST /mcp/tools/list
```

Returns all available MCP tools.

### Execute Tools

```text
POST /mcp/tools/call
```

Execute a specific tool with provided arguments.

### Health Check

```text
GET /health
```

Returns server health status and configuration.

## Example Tool Usage

### Read File

```json
{
  "name": "read_file",
  "arguments": {
    "path": "/shared/example.txt"
  }
}
```

### Write File

```json
{
  "name": "write_file",
  "arguments": {
    "path": "/shared/new-file.txt",
    "content": "Hello, MCP World!"
  }
}
```

### List Directory

```json
{
  "name": "list_directory",
  "arguments": {
    "path": "/shared"
  }
}
```

### Create Directory

```json
{
  "name": "create_directory",
  "arguments": {
    "path": "/shared/new-folder"
  }
}
```

### Delete File

```json
{
  "name": "delete_file",
  "arguments": {
    "path": "/shared/unwanted-file.txt"
  }
}
```

### Get File Info

```json
{
  "name": "file_info",
  "arguments": {
    "path": "/shared/example.txt"
  }
}
```

## Integration with Inference Gateway

This server is designed to work with the Inference Gateway's MCP support. Add
it to your gateway configuration:

```yaml
MCP_SERVERS: 'filesystem=http://mcp-filesystem:3000/mcp'
```

## Sample Files

The server automatically creates sample files in allowed directories on startup
to help with testing and demonstration.

## Error Handling

The server provides detailed error messages for common scenarios:

- File not found
- Permission denied
- Directory traversal attempts
- Invalid arguments
- Path outside allowed directories

## Extending the Server

To add new filesystem tools:

1. Add the tool definition to the `/mcp/tools/list` endpoint
2. Create a handler function for the tool
3. Add the case to the switch statement in `/mcp/tools/call`
4. Ensure proper path validation and error handling

## Security Considerations

- This server implements basic security measures but should be reviewed for
  production use
- Consider additional authentication and authorization mechanisms
- Monitor file system usage and implement quotas if needed
- Regularly audit allowed directories and permissions
