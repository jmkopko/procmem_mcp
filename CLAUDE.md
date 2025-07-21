# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server project for procedural memory management with spaced repetition algorithms. It consists of a TypeScript MCP server implementation and a web-based client interface for extracting, storing, and reviewing procedural skills.

## Common Development Commands

### Build and Development
```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Development mode with auto-reload using tsx
npm start              # Run the compiled server from dist/server.js
```

### Code Quality
```bash
npm run lint           # ESLint for TypeScript files in src/
npm test               # Run Jest tests
```

### File Structure
- `src/server.ts` - Main MCP server implementation (currently `mcp-server-implementation.ts`)
- `public/index.html` - Web UI for the client (currently `mcp-procedural-memory.html`)
- `public/mcp-client.js` - MCP client integration (currently `mcp-client-integration.js`)
- `dist/` - Compiled TypeScript output
- `package.json` configuration file (currently `mcp-package-json.json`)
- `tsconfig.json` configuration file (currently `mcp-tsconfig.json`)

## Architecture Overview

### MCP Server (server.ts)
The main server implements the Model Context Protocol with:
- **Tools**: `extract_skills`, `save_procedure`, `get_review_queue`, `mark_reviewed`, `delay_review`
- **Resources**: `procedures://list` and `procedures://{procedureId}` for accessing procedure data
- **In-memory storage**: Uses Map for demo purposes (should be replaced with database in production)
- **Spaced repetition algorithms**: Motor skills and cognitive procedures with different scheduling patterns

### Web Client Architecture
- **Standalone HTML/CSS/JS**: No external frameworks, uses vanilla JavaScript
- **Local storage**: Browser localStorage for persistence (demo mode)
- **MCP integration**: MCPClient class handles JSON-RPC communication with server
- **Two algorithm types**: Motor skills (exceptional retention) vs cognitive procedures (rapid initial decay)

### Algorithm Scheduling
The project implements two research-based spaced repetition algorithms:

**Motor Skills Algorithm**:
- Days 1-3: Initial intensive practice
- Days 4-7: Alternate day practice  
- Weeks 3-6: Weekly maintenance
- Months 2-6: Bi-weekly then monthly reviews

**Cognitive Procedures Algorithm**:
- Day 2: Critical 24-hour review
- Days 3-21: Aggressive early spaced practice
- Month 1: Weekly practice
- Months 2-8: Extended maintenance schedule

## Key Implementation Notes

### TypeScript Configuration
- Target: ES2022 with ES modules
- Output: `dist/` directory
- Strict mode enabled
- Source maps and declarations generated

### MCP Integration Patterns
- All tools return JSON-formatted responses in `content` array
- Error handling with structured error objects
- Resource URIs follow `procedures://` scheme
- Stdio transport for Claude Desktop integration

### Dependencies
- `@modelcontextprotocol/sdk`: Core MCP functionality
- `zod`: Schema validation for tool inputs
- `tsx`: Development auto-reload
- `jest`: Testing framework
- `eslint` + `@typescript-eslint/*`: Code quality

### Production Considerations
- Replace in-memory Map storage with persistent database
- Implement proper user authentication
- Add HTTP transport option for web client
- Consider LLM-based skill extraction improvements

## Integration with Claude Desktop

Add to Claude Desktop config:
```json
{
  "servers": {
    "procedural-memory": {
      "command": "node",
      "args": ["/path/to/dist/server.js"]
    }
  }
}
```

## Testing and Quality Assurance

The project uses Jest for testing and ESLint for code quality. When making changes:
1. Run `npm run lint` to check code style
2. Run `npm test` to verify functionality
3. Run `npm run build` to ensure TypeScript compilation succeeds
4. Test MCP integration using the web interface or Claude Desktop

Note: The current files use different naming conventions (with `mcp-` prefixes) which should be normalized to the standard structure during development.