# MCP Procedural Memory Manager

A Model Context Protocol (MCP) server and web client for extracting, storing, and reviewing procedural skills using spaced repetition algorithms. This project helps users convert knowledge from Claude conversations into actionable, reviewable procedures.

**Current Status**: Simplified implementation focused on skill extraction. Full spaced repetition features are planned for future development.

## Features

### Current Implementation
- **Skill Extraction**: Automatically extract procedural steps from Claude chat conversations using NLP pattern matching

### Planned Features (Future Work)
- **Spaced Repetition**: Two research-based algorithms for optimal retention:
  - Motor Skills Algorithm (for physical/motor procedures)
  - Cognitive Procedures Algorithm (for mental/cognitive tasks)
- **Web Interface**: User-friendly GUI for managing procedures
- **Review Management**: Track and complete reviews based on scientifically-proven schedules
- **Procedure Storage**: Save and organize extracted procedures

## Project Structure

```
mcp-procedural-memory/
├── src/
│   └── server.ts          # MCP server implementation
├── public/
│   ├── index.html         # Web UI
│   └── mcp-client.js      # MCP client integration
├── dist/                  # Compiled TypeScript output
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Installation

### Prerequisites

- Node.js v18.0 or higher
- npm or yarn package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-procedural-memory.git
cd mcp-procedural-memory
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript server:
```bash
npm run build
```

## Running the Server

### Option 1: Standalone Server (stdio)

Run the MCP server using stdio transport:

```bash
npm start
```

This will start the server listening on stdio for MCP protocol messages.

### Option 2: Development Mode

For development with auto-reload:

```bash
npm run dev
```

### Option 3: Integration with Claude Desktop

Add to your Claude Desktop configuration (`config.json`):

```json
{
  "servers": {
    "procedural-memory": {
      "command": "node",
      "args": ["/path/to/mcp-procedural-memory/dist/server.js"]
    }
  }
}
```

## Using the Web Interface

1. Open `public/index.html` in your web browser
2. If using the HTTP transport, ensure your MCP server is configured for HTTP
3. The interface provides:
   - **Skill Extraction**: Paste Claude chat content and extract steps
   - **Procedure Management**: Save and organize procedures
   - **Review Queue**: See what needs review based on the current date
   - **Progress Tracking**: Monitor your learning progress

## MCP Tools

### Current Implementation

The server currently exposes one working tool:

#### `extract_skills`
Extract procedural steps from chat content.

**Parameters:**
- `content` (string): The chat content to analyze
- `refinementPrompt` (string, optional): Additional instructions for extraction

**Returns:** JSON object with extracted steps array and success status

### Planned Tools (Future Work)

The following tools will be implemented in future versions:

#### `save_procedure`
Save a procedure with scheduling algorithm.

**Parameters:**
- `title` (string): Procedure title
- `steps` (array): Ordered list of steps
- `algorithm` ("motor" | "cognitive"): Scheduling algorithm

**Returns:** Saved procedure details

#### `get_review_queue`
Get procedures scheduled for review on a specific date.

**Parameters:**
- `date` (string): ISO date format (YYYY-MM-DD)

**Returns:** List of procedures to review

#### `mark_reviewed`
Mark a scheduled review as completed.

**Parameters:**
- `procedureId` (string): Procedure ID
- `reviewIndex` (number): Index in review schedule

**Returns:** Updated procedure status

#### `delay_review`
Delay a review by one day.

**Parameters:**
- `procedureId` (string): Procedure ID
- `reviewIndex` (number): Index in review schedule

**Returns:** New review date

## MCP Resources (Planned)

### `procedures://list`
Get all saved procedures with summary information.

### `procedures://{procedureId}`
Get detailed information about a specific procedure.

## Algorithm Details (Planned)

### Motor Skills Algorithm
Based on research showing motor skills have exceptional long-term retention:
- Initial intensive practice (Days 1-3)
- Alternate day practice (Days 4-7)
- Weekly maintenance (Months 1-6)
- Monthly refreshers (Year 2+)

### Cognitive Procedures Algorithm
Addresses rapid initial decay with aggressive early review:
- Critical 24-hour review (Day 2)
- Spaced practice (Days 3-21)
- Weekly practice (Month 1)
- Extended maintenance (6+ months)

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Extending the Skill Extraction

The skill extraction uses pattern matching for common action verbs and procedural language. To improve extraction:

1. Edit the `actionPatterns` array in `server.ts`
2. Add domain-specific patterns
3. Implement the `refinementPrompt` processing for LLM-based extraction

## Future Enhancements

### Core Features
- [ ] **Procedure Storage**: Implement `save_procedure` tool with in-memory storage
- [ ] **Review System**: Add `get_review_queue`, `mark_reviewed`, and `delay_review` tools
- [ ] **Spaced Repetition**: Implement motor and cognitive algorithms with scheduling
- [ ] **MCP Resources**: Add `procedures://list` and `procedures://{id}` resources

### Extended Features
- [ ] **Persistent Storage**: Replace in-memory storage with SQLite/PostgreSQL
- [ ] **Web Interface**: Create functional client for procedure management
- [ ] **User Authentication**: Multi-user support with authentication
- [ ] **Advanced NLP**: LLM-based skill extraction improvements
- [ ] **Export Options**: Export procedures to various formats
- [ ] **Mobile Integration**: Mobile app support
- [ ] **Analytics**: Learning insights and progress tracking
- [ ] **Collaboration**: Procedure sharing between users

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Model Context Protocol specification and SDK by Anthropic
- Spaced repetition research from cognitive science literature
- Procedural memory retention studies