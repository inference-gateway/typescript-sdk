# MCP Memory Server

A Model Context Protocol (MCP) server that provides memory persistence capabilities for AI agents. This server helps agents save their state when HTTP errors occur, allowing them to continue from where they left off in subsequent iterations.

## Features

- **State Persistence**: Save arbitrary state objects with session IDs
- **Error State Recovery**: Specially handle saving state when HTTP errors occur
- **Session Management**: List, restore, and clear saved sessions
- **File-based Storage**: Persistent storage using JSON files

## Tools

### `save-state`

Saves the current state for a session.

**Parameters:**

- `sessionId` (string): Unique session identifier
- `state` (object): State object to persist
- `context` (string, optional): Context description

### `save-error-state`

Saves state along with error information when an HTTP error occurs.

**Parameters:**

- `sessionId` (string): Unique session identifier
- `state` (object): State object to persist
- `error` (object): Error information (message, code, status, url)
- `context` (string, optional): Context description

### `restore-state`

Restores the saved state for a session.

**Parameters:**

- `sessionId` (string): Unique session identifier

### `list-sessions`

Lists all saved sessions with their metadata.

### `clear-session`

Removes a saved session.

**Parameters:**

- `sessionId` (string): Unique session identifier

## Environment Variables

- `MEMORY_DIR`: Directory for storing memory files (default: `/tmp/memory`)
- `PORT`: Server port (default: `3004`)

## Usage Example

```javascript
// Save state before making an HTTP request
await saveState({
  sessionId: 'agent-task-123',
  state: {
    currentStep: 'api-call',
    url: 'https://api.example.com/data',
    payload: { param: 'value' },
    retryCount: 0,
  },
  context: 'About to make API call to fetch user data',
});

// If HTTP error occurs, save error state
await saveErrorState({
  sessionId: 'agent-task-123',
  state: {
    currentStep: 'api-call-failed',
    url: 'https://api.example.com/data',
    payload: { param: 'value' },
    retryCount: 1,
  },
  error: {
    message: 'HTTP 500 Internal Server Error',
    status: 500,
    url: 'https://api.example.com/data',
  },
  context: 'API call failed, need to retry',
});

// In next iteration, restore state
const restoredData = await restoreState({
  sessionId: 'agent-task-123',
});
// Continue from where we left off...
```
