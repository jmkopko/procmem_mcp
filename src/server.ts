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

// Standard refinement prompt for skill analysis
const DEFAULT_REFINEMENT_PROMPT = `
Analyze the following extracted procedural steps and refine them to be:
1. Clear and actionable (start with action verbs)
2. Specific and detailed (avoid vague language)
3. Sequential and logical (proper order)
4. Concise but complete (remove redundancy)
5. Properly formatted (consistent style)

For each step, ensure it:
- Starts with an action verb (click, open, enter, etc.)
- Includes specific targets (button names, field labels, etc.)
- Contains necessary context or conditions
- Uses consistent terminology
- Is measurable/verifiable

Remove any:
- Duplicate or redundant steps
- Non-actionable commentary
- Steps that are too vague or general
- Incorrect sequencing

Return the refined steps in the same JSON format with improved descriptions.
`;

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
  let steps: ProcedureStep[] = [];
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

  // Apply refinement using standard prompt or custom prompt
  if (steps.length > 0) {
    const promptToUse = refinementPrompt || DEFAULT_REFINEMENT_PROMPT;
    steps = refineSteps(steps, promptToUse);
  }

  return steps;
}

// Function to refine extracted steps using the refinement prompt
function refineSteps(steps: ProcedureStep[], refinementPrompt: string): ProcedureStep[] {
  const refinedSteps: ProcedureStep[] = [];
  
  for (const step of steps) {
    let description = step.description;
    
    // Apply basic refinement rules based on the prompt
    description = applyRefinementRules(description);
    
    // Only keep non-empty, meaningful steps
    if (description.length > 5 && !isRedundantStep(description, refinedSteps)) {
      refinedSteps.push({
        order: refinedSteps.length + 1,
        description: description
      });
    }
  }
  
  return refinedSteps.length > 0 ? refinedSteps : steps; // Fallback to original if refinement fails
}

// Apply refinement rules to improve step descriptions
function applyRefinementRules(description: string): string {
  let refined = description.trim();
  
  // Ensure steps start with action verbs
  if (!/^(click|select|enter|type|navigate|open|create|set|configure|add|remove|update|install|download|upload|save|delete|copy|paste|cut|move|drag|drop|scroll|zoom|rotate|resize|go|press|choose|fill)/i.test(refined)) {
    // Try to extract an action from the sentence
    const actionMatch = refined.match(/(click|select|enter|type|navigate|open|create|set|configure|add|remove|update|install|download|upload|save|delete|copy|paste|cut|move|drag|drop|scroll|zoom|rotate|resize|go|press|choose|fill)[^.]*$/i);
    if (actionMatch) {
      refined = actionMatch[0].charAt(0).toUpperCase() + actionMatch[0].slice(1);
    }
  }
  
  // Capitalize first letter
  refined = refined.charAt(0).toUpperCase() + refined.slice(1);
  
  // Remove redundant phrases
  refined = refined.replace(/^(you should|you need to|you must|make sure to|be sure to)\s+/i, '');
  refined = refined.replace(/^(step \d+[:.]\s*)/i, '');
  refined = refined.replace(/^(next,?\s*)/i, '');
  refined = refined.replace(/^(then,?\s*)/i, '');
  refined = refined.replace(/^(after that,?\s*)/i, '');
  
  // Ensure proper ending
  if (!/[.!?]$/.test(refined)) {
    refined += '.';
  }
  
  return refined;
}

// Check if a step is redundant compared to existing steps
function isRedundantStep(description: string, existingSteps: ProcedureStep[]): boolean {
  const normalized = description.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  for (const step of existingSteps) {
    const existing = step.description.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    // Check for exact match or very similar content
    if (normalized === existing || 
        normalized.includes(existing) || 
        existing.includes(normalized)) {
      return true;
    }
    
    // Check for semantic similarity (simple word overlap)
    const words1 = normalized.split(/\s+/);
    const words2 = existing.split(/\s+/);
    const overlap = words1.filter(word => words2.includes(word)).length;
    const similarity = overlap / Math.max(words1.length, words2.length);
    
    if (similarity > 0.7) { // 70% word overlap threshold
      return true;
    }
  }
  
  return false;
}


// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Procedural Memory Server running on stdio");
}

main().catch(console.error);