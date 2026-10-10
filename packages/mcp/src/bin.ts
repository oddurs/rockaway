#!/usr/bin/env node
/**
 * `rockaway-mcp`: the server on stdio (cairn 0048), for an MCP client to start.
 *
 *   claude mcp add rockaway -- npx -y @rockaway/mcp
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.ts';

await createServer().connect(new StdioServerTransport());
