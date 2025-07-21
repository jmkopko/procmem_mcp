// mcp-procedural-memory-server.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Types for our procedural memory system
interface ProcedureStep {
  order: number;
  description: string;
}

interface ReviewDate {
  date: string;
  label: string;
  completed: boolean;
}

interface Procedure {
  id: string;
  title: string;
  steps: ProcedureStep[];
  algorithm: "motor" | "cognitive";
  createdAt: string;
  currentStep: number;
  reviewDates: ReviewDate[];
}

// Algorithm configurations
const algorithmSchedules = {
  motor: [
    { day: 1, label: "Day 1: Initial Learning" },
    { day: 2, label: "Day 2: Practice" },
    { day: 3, label: "Day 3: Practice" },
    { day: 4, label: "Day 4: Alternate Practice" },
    { day: 6, label: "Day 6: Alternate Practice" },
    { day: 10, label: "Day 10: Bi-weekly Practice" },
    { day: 14, label: "Day 14: Bi-weekly Practice" },
    { day: 21, label: "Week 3: Weekly Maintenance" },
    { day: 28, label: "Week 4: Weekly Maintenance" },
    { day: 35, label: "Week 5: Weekly Maintenance" },
    { day: 42, label: "Week 6: Weekly Maintenance" },
    { day: 56, label: "Month 2: Bi-weekly" },
    { day: 70, label: "Month 2.5: Bi-weekly" },
    { day: 84, label: "Month 3: Bi-weekly" },
    { day: 112, label: "Month 4: Monthly" },
    { day: 140, label: "Month 5: Monthly" },
    { day: 168, label: "Month 6: Monthly" },
    { day: 365, label: "Year 1: Monthly" }
  ],
  cognitive: [
    { day: 1, label: "Day 1: Initial Learning" },
    { day: 2, label: "Day 2: Critical Review" },
    { day: 3, label: "Day 3: Spaced Practice" },
    { day: 5, label: "Day 5: Spaced Practice" },
    { day: 8, label: "Day 8: Spaced Practice" },
    { day: 14, label: "Day 14: Consolidation" },
    { day: 21, label: "Day 21: Consolidation" },
    { day: 28, label: "Week 4: Weekly Practice" },
    { day: 35, label: "Week 5: Weekly Practice" },
    { day: 42, label: "Week 6: Weekly Practice" },
    { day: 49, label: "Week 7: Weekly Practice" },
    { day: 63, label: "Month 2: Bi-weekly" },
    { day: 77, label: "Month 2.5: Bi-weekly" },
    { day: 91, label: "Month 3: Bi-weekly" },
    { day: 120, label: "Month 4: Monthly" },
    { day: 150, label: "Month 5: Monthly" },
    { day: 180, label: "Month 6: Monthly" },
    { day: 240, label: "Month 8: Extended" }
  ]
};

// In-memory storage for demo (replace with proper database in production)
const procedures = new Map<string, Procedure>();

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
    inputSchema: z.object({
      content: z.string().describe("The chat content to analyze"),
      refinementPrompt: z.string().optional().describe("Optional prompt to refine extraction")
    }) as any
  },
  async (extra) => {
    const { content, refinementPrompt } = extra.request.params;
    try {
      const steps = extractProcedureSteps(content, refinementPrompt);
      
      return {
        content: [{
          type: "text",
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
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          })
        }]
      };
    }
  }
);

// Tool: Save procedure with algorithm
server.registerTool(
  "save_procedure",
  {
    title: "Save Procedure",
    description: "Save a procedure with steps and scheduling algorithm",
    inputSchema: z.object({
      title: z.string().describe("Title of the procedure"),
      steps: z.array(z.object({
        order: z.number(),
        description: z.string()
      })).describe("Ordered list of procedure steps"),
      algorithm: z.enum(["motor", "cognitive"]).describe("Scheduling algorithm type")
    }) as any
  },
  async (extra) => {
    const { title, steps, algorithm } = extra.request.params;
    const now = new Date();
    const procedure: Procedure = {
      id: Date.now().toString(),
      title,
      steps,
      algorithm,
      createdAt: now.toISOString(),
      currentStep: 0,
      reviewDates: calculateReviewDates(now, algorithm)
    };

    procedures.set(procedure.id, procedure);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          procedureId: procedure.id,
          title: procedure.title,
          stepCount: steps.length,
          algorithm: algorithm,
          firstReviewDate: procedure.reviewDates[0]?.date
        }, null, 2)
      }]
    };
  }
);

// Tool: Get procedures for review on a specific date
server.registerTool(
  "get_review_queue",
  {
    title: "Get Review Queue",
    description: "Get procedures scheduled for review on a specific date",
    inputSchema: z.object({
      date: z.string().describe("ISO date string (YYYY-MM-DD)")
    }) as any
  },
  async (extra) => {
    const { date } = extra.request.params;
    const reviewItems: Array<{
      procedureId: string;
      title: string;
      algorithm: string;
      reviewIndex: number;
      reviewLabel: string;
      stepCount: number;
    }> = [];

    procedures.forEach((procedure) => {
      procedure.reviewDates.forEach((review, index) => {
        if (review.date === date && !review.completed) {
          reviewItems.push({
            procedureId: procedure.id,
            title: procedure.title,
            algorithm: procedure.algorithm,
            reviewIndex: index,
            reviewLabel: review.label,
            stepCount: procedure.steps.length
          });
        }
      });
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          date: date,
          itemCount: reviewItems.length,
          items: reviewItems
        }, null, 2)
      }]
    };
  }
);

// Tool: Mark review as completed
server.registerTool(
  "mark_reviewed",
  {
    title: "Mark Review Completed",
    description: "Mark a scheduled review as completed",
    inputSchema: z.object({
      procedureId: z.string().describe("ID of the procedure"),
      reviewIndex: z.number().describe("Index of the review in the schedule")
    }) as any
  },
  async (extra) => {
    const { procedureId, reviewIndex } = extra.request.params;
    const procedure = procedures.get(procedureId);
    if (!procedure) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Procedure not found"
          })
        }]
      };
    }

    if (reviewIndex >= procedure.reviewDates.length) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Invalid review index"
          })
        }]
      };
    }

    procedure.reviewDates[reviewIndex].completed = true;
    procedure.currentStep = reviewIndex + 1;

    const nextReview = procedure.reviewDates.find((r, i) => i > reviewIndex && !r.completed);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          procedureId: procedureId,
          completedReview: procedure.reviewDates[reviewIndex].label,
          nextReview: nextReview ? {
            date: nextReview.date,
            label: nextReview.label
          } : null
        }, null, 2)
      }]
    };
  }
);

// Tool: Delay a review by one day
server.registerTool(
  "delay_review",
  {
    title: "Delay Review",
    description: "Delay a scheduled review by one day",
    inputSchema: z.object({
      procedureId: z.string().describe("ID of the procedure"),
      reviewIndex: z.number().describe("Index of the review in the schedule")
    }) as any
  },
  async (extra) => {
    const { procedureId, reviewIndex } = extra.request.params;
    const procedure = procedures.get(procedureId);
    if (!procedure) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Procedure not found"
          })
        }]
      };
    }

    const currentDate = new Date(procedure.reviewDates[reviewIndex].date);
    currentDate.setDate(currentDate.getDate() + 1);
    procedure.reviewDates[reviewIndex].date = currentDate.toISOString().split('T')[0];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          procedureId: procedureId,
          reviewIndex: reviewIndex,
          newDate: procedure.reviewDates[reviewIndex].date
        }, null, 2)
      }]
    };
  }
);

// Resource: List all procedures
server.registerResource(
  "procedures",
  "procedures://list",
  {
    title: "All Procedures",
    description: "List of all saved procedures",
    mimeType: "application/json"
  },
  async (uri) => {
    const procedureList = Array.from(procedures.values()).map(proc => ({
      id: proc.id,
      title: proc.title,
      algorithm: proc.algorithm,
      stepCount: proc.steps.length,
      createdAt: proc.createdAt,
      progress: `${proc.reviewDates.filter(r => r.completed).length}/${proc.reviewDates.length}`
    }));

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(procedureList, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// Resource: Get specific procedure details
server.registerResource(
  "procedure-detail",
  new ResourceTemplate("procedures://{procedureId}", { list: undefined }),
  {
    title: "Procedure Details",
    description: "Detailed information about a specific procedure"
  },
  async (uri, variables) => {
    const procedureId = variables.procedureId as string;
    const procedure = procedures.get(procedureId);
    if (!procedure) {
      throw new Error("Procedure not found");
    }

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(procedure, null, 2),
        mimeType: "application/json"
      }]
    };
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

// Helper function to calculate review dates
function calculateReviewDates(startDate: Date, algorithm: "motor" | "cognitive"): ReviewDate[] {
  const schedule = algorithmSchedules[algorithm];
  
  return schedule.map(item => {
    const reviewDate = new Date(startDate);
    reviewDate.setDate(reviewDate.getDate() + item.day - 1);
    
    return {
      date: reviewDate.toISOString().split('T')[0],
      label: item.label,
      completed: false
    };
  });
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Procedural Memory Server running on stdio");
}

main().catch(console.error);