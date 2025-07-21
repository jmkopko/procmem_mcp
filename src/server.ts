// mcp-procedural-memory-server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Types for skill extraction
interface ProcedureStep {
  order: number;
  description: string;
}

// Skill extraction patterns
const actionPatterns = [
  /\b(click|select|enter|type|navigate|open|create|set|configure|add|remove|update|install|download|upload|save|delete|copy|paste|cut|move|drag|drop|scroll|zoom|rotate|resize)\b/gi,
  /\b(step\s+\d+|first|then|next|after|finally|begin|start|proceed|continue)\b/gi,
  /\b(should|must|need to|have to|required to|make sure|ensure|verify|check|confirm)\b/gi
];

// Create MCP server
const server = new McpServer({
  name: "procedural-memory-server",
  version: "1.0.0"
});

// Tool: Extract skills from chat content
server.registerTool(
  "extract_skills",
  {
    title: "Extract Skills from Chat",
    description: "Analyze chat content to extract procedural steps",
    inputSchema: {
      content: z.string().describe("The chat content to analyze"),
      refinementPrompt: z.string().optional().describe("Optional prompt to refine extraction")
    }
  },
  async (params) => {
    const { content, refinementPrompt } = params;
    try {
      const steps = extractProcedureSteps(content, refinementPrompt);
      
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            steps: steps,
            count: steps.length
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          })
        }]
      };
    }
  }
);



// Helper function to extract procedure steps from text
function extractProcedureSteps(content: string, refinementPrompt?: string): ProcedureStep[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const steps: ProcedureStep[] = [];
  let order = 1;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // Check if sentence matches any action patterns
    let isActionable = false;
    for (const pattern of actionPatterns) {
      if (pattern.test(trimmed)) {
        isActionable = true;
        break;
      }
    }

    if (isActionable) {
      steps.push({
        order: order++,
        description: trimmed
      });
    }
  }

  // If no steps found, try a more lenient extraction
  if (steps.length === 0) {
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.trim().length > 10) { // Arbitrary minimum length
        steps.push({
          order: order++,
          description: line.trim()
        });
      }
    }
  }

  // Apply refinement if provided
  if (refinementPrompt && steps.length > 0) {
    // This is a placeholder for more sophisticated NLP refinement
    // In a real implementation, you might use an LLM API here
    console.log(`Refinement prompt: ${refinementPrompt}`);
  }

  return steps;
}


// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Procedural Memory Server running on stdio");
}

main().catch(console.error);