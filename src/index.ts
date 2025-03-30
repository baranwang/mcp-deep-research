#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type ServerResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Type Definitions
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchSuccessResponse {
  query: string;
  results: TavilySearchResult[];
}

interface TavilySearchErrorResponse {
  detail: {
    error: string;
  };
}

// Utility Functions
function safeParseInt(value: string | undefined, defaultValue: number): number {
  const parsed = Number.parseInt(value ?? '');
  return Number.isNaN(parsed) || parsed < 1 ? defaultValue : parsed;
}

// Configuration
const CONFIG = {
  MAX_SEARCH_KEYWORDS: safeParseInt(process.env.MAX_SEARCH_KEYWORDS, 5),
  MAX_PLANNING_ROUNDS: safeParseInt(process.env.MAX_PLANNING_ROUNDS, 5),
  TAVILY_API_URL: 'https://api.tavily.com/search',
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  PACKAGE_VERSION: process.env.PACKAGE_VERSION ?? '0.0.0',
} as const;

async function searchTavily(keyword: string, topic: string): Promise<string> {
  const response = await fetch(CONFIG.TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query: keyword,
      search_depth: 'basic',
      topic,
    }),
  });

  if (response.status !== 200) {
    const data = (await response.json()) as TavilySearchErrorResponse;
    throw new Error(data?.detail?.error);
  }

  const data = (await response.json()) as TavilySearchSuccessResponse;
  return formatSearchResults(data);
}

function formatSearchResults(data: TavilySearchSuccessResponse): string {
  let result = `## Search Results for \`${data.query}\`\n`;
  data.results.forEach((searchResult, index) => {
    result += `### Reference ${index + 1}:\n`;
    result += `Title: ${searchResult.title}\n`;
    result += `Content: ${searchResult.content}\n`;
  });
  return result;
}

function generatePrompt(question: string, searchResults: string, rounds: number): string {
  return `# Role Definition
You are a professional information search and analysis expert, specializing in:
- Analyzing core information needs from user queries
- Designing precise search strategies
- Synthesizing and distilling information
- Providing accurate and comprehensive answers

# User Question
${question}

# Current Environment
Current Search Round: ${rounds}
Maximum Search Rounds: ${CONFIG.MAX_PLANNING_ROUNDS}
Current Time: ${new Date().toLocaleString()}

# Known Information
${searchResults ?? 'No reference information available'}

# Analysis Steps
1. Resource Sufficiency Assessment
   - Carefully analyze if existing information is sufficient to answer the user's question
   - Identify information gaps or areas requiring additional verification

2. Search Strategy (if needed)
   - Identify specific information points that need supplementation
   - Design precise search keywords (each keyword must meet these requirements):
     * Include complete subject and predicate
     * Avoid pronouns and references
     * Have independent search value
     * Avoid logical overlap between keywords
   - Keyword quantity limit: 1~${CONFIG.MAX_SEARCH_KEYWORDS}

3. Continue Search (if needed)
   - Use current "Known Information" as reference parameter
   - Set rounds parameter to ${rounds + 1}
   - Output only search keywords, without any other content

4. Direct Answer (if information is sufficient)
   - Provide complete answer based on available information
   - Ensure the answer is accurate, comprehensive, and logically clear

# Output Requirements
## If Further Search is Needed
- Output only the list of search keywords
- One keyword per line
- Do not include any other explanations or notes

## If Direct Answer is Possible
- Provide a clear, structured answer
- Reference relevant sources when necessary
- Clearly indicate any uncertain information

# Constraints
- Current round has reached ${rounds}/${CONFIG.MAX_PLANNING_ROUNDS}, must provide direct answer if maximum rounds exceeded
- Search keywords must be independent and precise, no ambiguity allowed
- Prohibited to output content unrelated to search strategy`;
}

// Schema Definition
const DeepResearchToolSchema = z.object({
  question: z.string().describe('User question'),
  reference: z.string().optional().describe('Reference materials'),
  keywords: z
    .array(z.string())
    .min(0)
    .max(CONFIG.MAX_SEARCH_KEYWORDS)
    .optional()
    .describe(
      `Search keywords, please provide 1~${CONFIG.MAX_SEARCH_KEYWORDS} keywords. Each keyword must: include complete subject and predicate, avoid pronouns and references, have independent search value, avoid logical overlap between keywords, and be directly relevant to the question`,
    ),
  topic: z.enum(['general', 'news', 'finance']).default('general').describe('Search topic'),
  rounds: z.number().default(1).describe('Current search round, defaults to 1'),
});

// Main Business Logic
async function deepResearch(args: unknown): Promise<ServerResult> {
  if (!CONFIG.TAVILY_API_KEY) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Please configure the `TAVILY_API_KEY` environment variable' }],
    };
  }

  const { question, reference = '', keywords = [], topic, rounds } = DeepResearchToolSchema.parse(args);

  let searchResults = reference;
  if (keywords.length) {
    const results = await Promise.allSettled(keywords.map((keyword) => searchTavily(keyword, topic)));

    searchResults += results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map((result) => result.value)
      .join('\n');
  }

  return {
    content: [
      {
        type: 'text',
        text: generatePrompt(question, searchResults, rounds),
      },
    ],
  };
}

// Server Setup and Startup
async function main() {
  const mcpServer = new McpServer(
    {
      name: 'DeepResearch',
      version: CONFIG.PACKAGE_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  mcpServer.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [
      {
        name: 'deep-research',
        description:
          'Deep web information search tool that can conduct multi-round in-depth research based on keywords and topics',
        inputSchema: zodToJsonSchema(DeepResearchToolSchema),
      },
    ],
  }));

  mcpServer.server.setRequestHandler(CallToolRequestSchema, (request) => deepResearch(request.params.arguments));

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

// Start Server
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
