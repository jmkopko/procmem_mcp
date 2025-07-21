# MCP Procedural Memory Manager

A Model Context Protocol (MCP) server and web client for extracting, storing, and scheduling review of procedural skills using spaced repetition algorithms. This project helps users convert knowledge from Claude conversations into actionable, reviewable procedures with minimal planning.  It facilitates optimized scheduling of procedure practice and interleaving of different skills for practice.

**Current Status**: Simplified implementation focused on simulating skill extraction and an example interface for skill repetition. Full integration between MCP server and web app requires future development.

## Features

### Current Implementation
- **Skill Extraction**: Automatically extract procedural steps from Claude chat conversations using NLP pattern matching.

### Planned Features (Future Work)
- **Spaced Repetition**: Two research-based algorithms for optimal retention:
  - Motor Skills Algorithm (for physical/motor procedures)
  - Cognitive Procedures Algorithm (for mental/cognitive tasks)
- **Web Interface**: User-friendly GUI for managing/reviewing saved procedures
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
git clone https://github.com/jmkopko/procmem_mcp.git
cd procmem_mcp
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


### Option 2: Integration with Claude Desktop

Add to your Claude Desktop configuration (`config.json`):

```json
{
  "servers": {
    "procedural-memory-server": {
            "command": "/your/path/to/system/node",
            "args": ["/your/path/to/procmem_mcp/dist/server.js"],
            "cwd": "/your/path/to/procmem_mcp/dist"
  }
}
```

## Using the Web Interface
0. Navigate to `public/` and run a simple HTTP server. 
1. Open `public/index.html` in your web browser
2. The interface provides:
   - **Skill Extraction**: Paste Claude chat content and extract steps, or include extracted steps from MCP tool
   - **Procedure Management**: Refine, organize, and save procedures
   - **Review Queue**: See what needs review based on the current date
   - **Progress Tracking**: Monitor your learning progress, and see future practice

## MCP Tools

### Current Implementation

The server currently exposes one working tool:

#### `extract_skills`
Extract procedural steps from LLM chat content.

**Parameters:**
- `content` (string): The chat content to analyze
- `refinementPrompt` (string, optional): Additional instructions for extraction

**Returns:** JSON object with extracted steps array

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

## Algorithm Details

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


### Extending the Skill Extraction

The skill extraction uses pattern matching for common action verbs and procedural language. To improve extraction:

1. Edit the `actionPatterns` array in `server.ts`
2. Add domain-specific patterns
3. Implement the `refinementPrompt` processing for LLM-based extraction

## Future Enhancements

### Extended Features
- [ ] **Persistent Storage**: Replace in-memory storage with SQLite/PostgreSQL and user-specific storage options
- [ ] **Web Interface**: Refine functional client for procedure management
- [ ] **User Authentication**: Multi-user support with authentication
- [ ] **Advanced NLP**: LLM-based skill extraction improvements
- [ ] **Export Options**: Export procedures to various formats
- [ ] **Mobile Integration**: Mobile app support for skill review
- [ ] **Analytics**: Learning insights and progress tracking
- [ ] **Collaboration**: Procedure sharing between users
- [ ] **Advanced Algorithms**: Include more skill types with distinct algorithms
- [ ] **Included Practice Interfaces**: Use LTI and other HTML-embeddable interfaces for skill practice


## Acknowledgments

- Model Context Protocol specification and SDK by Anthropic
- Spaced repetition research from cognitive science literature (available on request)
- Procedural memory retention studies