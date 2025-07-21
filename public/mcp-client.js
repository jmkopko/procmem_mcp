// mcp-client.js
// This file demonstrates how to integrate the web UI with the MCP server

class MCPClient {
  constructor(serverUrl = 'http://localhost:3000/mcp') {
    this.serverUrl = serverUrl;
    this.sessionId = null;
    this.requestId = 0;
  }

  // Initialize connection to MCP server
  async connect() {
    try {
      const response = await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          experimental: {}
        },
        clientInfo: {
          name: 'procedural-memory-web-client',
          version: '1.0.0'
        }
      });

      this.sessionId = response.sessionId;
      console.log('Connected to MCP server:', response);
      return true;
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      return false;
    }
  }

  // Send a JSON-RPC request to the server
  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: method,
      params: params
    };

    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2024-11-05'
      },
      body: JSON.stringify(request)
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.result;
  }

  // Extract skills from chat content
  async extractSkills(content, refinementPrompt = null) {
    const result = await this.sendRequest('tools/call', {
      name: 'extract_skills',
      arguments: {
        content: content,
        refinementPrompt: refinementPrompt
      }
    });

    // Parse the tool response
    const response = JSON.parse(result.content[0].text);
    if (!response.success) {
      throw new Error(response.error);
    }

    return response.steps;
  }

  // Save a procedure with steps and algorithm
  async saveProcedure(title, steps, algorithm) {
    const result = await this.sendRequest('tools/call', {
      name: 'save_procedure',
      arguments: {
        title: title,
        steps: steps,
        algorithm: algorithm
      }
    });

    const response = JSON.parse(result.content[0].text);
    if (!response.success) {
      throw new Error('Failed to save procedure');
    }

    return response;
  }

  // Get procedures scheduled for review on a specific date
  async getReviewQueue(date) {
    const result = await this.sendRequest('tools/call', {
      name: 'get_review_queue',
      arguments: {
        date: date
      }
    });

    return JSON.parse(result.content[0].text);
  }

  // Mark a review as completed
  async markReviewed(procedureId, reviewIndex) {
    const result = await this.sendRequest('tools/call', {
      name: 'mark_reviewed',
      arguments: {
        procedureId: procedureId,
        reviewIndex: reviewIndex
      }
    });

    const response = JSON.parse(result.content[0].text);
    if (!response.success) {
      throw new Error(response.error);
    }

    return response;
  }

  // Delay a review by one day
  async delayReview(procedureId, reviewIndex) {
    const result = await this.sendRequest('tools/call', {
      name: 'delay_review',
      arguments: {
        procedureId: procedureId,
        reviewIndex: reviewIndex
      }
    });

    const response = JSON.parse(result.content[0].text);
    if (!response.success) {
      throw new Error(response.error);
    }

    return response;
  }

  // Get all procedures
  async getAllProcedures() {
    const result = await this.sendRequest('resources/read', {
      uri: 'procedures://list'
    });

    return JSON.parse(result.contents[0].text);
  }

  // Get specific procedure details
  async getProcedureDetails(procedureId) {
    const result = await this.sendRequest('resources/read', {
      uri: `procedures://${procedureId}`
    });

    return JSON.parse(result.contents[0].text);
  }
}

// Example usage with the web UI
// This would replace the simulated functions in the HTML

// Initialize MCP client
const mcpClient = new MCPClient();

// Modified extractSkills function to use MCP
async function extractSkillsViaMCP() {
  const chatContent = document.getElementById('chatInput').value;
  if (!chatContent.trim()) {
    showStatus('Please enter chat content to extract skills from', 'error');
    return;
  }

  const extractBtn = document.getElementById('extractBtn');
  const loading = document.getElementById('extractLoading');
  extractBtn.disabled = true;
  loading.style.display = 'inline-block';

  try {
    // Ensure we're connected
    if (!mcpClient.sessionId) {
      await mcpClient.connect();
    }

    // Extract skills using MCP
    const steps = await mcpClient.extractSkills(chatContent);
    
    // Convert to format expected by UI
    currentExtractedSteps = steps.map(step => step.description);
    
    displayExtractedSteps(currentExtractedSteps);
    document.getElementById('saveBtn').disabled = false;
    showStatus('Skills extracted successfully!', 'success');
  } catch (error) {
    showStatus('Failed to extract skills: ' + error.message, 'error');
  } finally {
    extractBtn.disabled = false;
    loading.style.display = 'none';
  }
}

// Modified saveProcedure function to use MCP
async function saveProcedureViaMCP() {
  const title = document.getElementById('skillTitle').value.trim();
  if (!title) {
    showStatus('Please enter a title for the procedure', 'error');
    return;
  }

  try {
    // Get edited steps
    const stepElements = document.querySelectorAll('#stepsList li');
    const steps = Array.from(stepElements).map((li, index) => ({
      order: index + 1,
      description: li.textContent.replace(/^\d+\.\s*/, '')
    }));

    const algorithm = document.getElementById('algorithmSelect').value;
    
    // Save via MCP
    const result = await mcpClient.saveProcedure(title, steps, algorithm);
    
    // Reset form
    document.getElementById('chatInput').value = '';
    document.getElementById('skillTitle').value = '';
    currentExtractedSteps = [];
    document.getElementById('extractedSteps').style.display = 'none';
    document.getElementById('saveBtn').disabled = true;
    
    // Refresh the UI
    await refreshProcedureList();
    await refreshReviewQueue();
    
    showStatus('Procedure saved successfully!', 'success');
  } catch (error) {
    showStatus('Failed to save procedure: ' + error.message, 'error');
  }
}

// Refresh procedures list from MCP server
async function refreshProcedureList() {
  try {
    const procedures = await mcpClient.getAllProcedures();
    updateProcedureListUI(procedures);
  } catch (error) {
    console.error('Failed to refresh procedures:', error);
  }
}

// Refresh review queue from MCP server
async function refreshReviewQueue() {
  try {
    const selectedDate = document.getElementById('reviewDate').value;
    const queue = await mcpClient.getReviewQueue(selectedDate);
    updateReviewQueueUI(queue);
  } catch (error) {
    console.error('Failed to refresh review queue:', error);
  }
}

// Export for use in HTML
window.MCPClient = MCPClient;
window.mcpClient = mcpClient;