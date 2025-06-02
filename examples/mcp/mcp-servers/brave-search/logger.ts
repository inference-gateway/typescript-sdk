/**
 * Standardized Winston Logger for MCP Servers
 *
 * Provides consistent, single-line logging across all MCP servers
 * with structured metadata and unified formatting.
 */

import winston from 'winston';

/**
 * Create a standardized logger for MCP servers
 * @param serviceName - The name of the MCP service
 * @param version - The version of the service
 * @param logLevel - Override log level (defaults to LOG_LEVEL env var or 'info')
 * @returns Configured Winston logger
 */
export function createMcpLogger(
  serviceName: string,
  version = '1.0.0',
  logLevel?: string
): winston.Logger {
  const level = logLevel || process.env.LOG_LEVEL || 'info';

  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: serviceName,
      version,
      protocol: 'Model Context Protocol',
      transport: 'Streamable HTTP',
    },
    transports: [
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
  });
}

/**
 * Log MCP request received
 */
export function logMcpRequest(
  logger: winston.Logger,
  req: any,
  additionalMeta: Record<string, any> = {}
): void {
  const sessionId = req.headers['mcp-session-id'];
  const method = req.body?.method;
  const id = req.body?.id;

  logger.info('MCP request received', {
    sessionId,
    method,
    requestId: id,
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'],
    ...additionalMeta,
  });
}

/**
 * Log MCP session events
 */
export function logMcpSession(
  logger: winston.Logger,
  event: string,
  sessionId: string,
  additionalMeta: Record<string, any> = {}
): void {
  logger.info(`MCP session ${event}`, {
    sessionId,
    ...additionalMeta,
  });
}

/**
 * Log MCP tool calls
 */
export function logMcpToolCall(
  logger: winston.Logger,
  toolName: string,
  sessionId: string,
  args: Record<string, any> = {},
  additionalMeta: Record<string, any> = {}
): void {
  logger.info(`MCP tool called: ${toolName}`, {
    sessionId,
    tool: toolName,
    args: Object.keys(args),
    ...additionalMeta,
  });
}

/**
 * Log MCP errors with context
 */
export function logMcpError(
  logger: winston.Logger,
  error: Error,
  context: Record<string, any> = {}
): void {
  logger.error('MCP error occurred', {
    error: error.message,
    stack: error.stack,
    ...context,
  });
}
