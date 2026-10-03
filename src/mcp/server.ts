import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import { getCodeOutline } from "../ast/outline";
import { AstCache } from "../ast/cache";
import { compress } from "../compressor/compressor";
import { globalAnalyticsStore } from "../analytics/store";
import { getConfig } from "../config/config";

const config = getConfig();
const astCache = new AstCache(config.astCacheSize);

const server = new Server(
  {
    name: "token-context-optimizer",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_code_outline",
        description: "Get a compressed AST structural outline of a source code file. Extremely useful for understanding large files without reading their full contents.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path to the source file",
            },
            language: {
              type: "string",
              description: "Language of the file (e.g., 'python', 'typescript')",
            },
            focusedSymbols: {
              type: "array",
              items: { type: "string" },
              description: "Optional list of function/class names to preserve fully while outlining the rest.",
            },
          },
          required: ["path", "language"],
        },
      },
      {
        name: "compress_output",
        description: "Manually compress a string of output (like build logs, stack traces, or git diffs).",
        inputSchema: {
          type: "object",
          properties: {
            output: {
              type: "string",
              description: "The raw text output to compress",
            },
            tool: {
              type: "string",
              description: "The name of the tool that generated the output (e.g., 'pytest', 'git')",
            },
            maxTokens: {
              type: "number",
              description: "Maximum tokens to pass through unchanged",
            },
          },
          required: ["output"],
        },
      },
      {
        name: "get_token_savings",
        description: "Get current session analytics for token optimization savings.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "get_code_outline") {
      const args = request.params.arguments as any;
      const path = args.path;
      const lang = args.language;
      const focused = args.focusedSymbols || [];

      const source = await fs.readFile(path, "utf-8");
      
      const cached = astCache.get(path, lang, source, focused);
      if (cached) {
          return {
              content: [{
                  type: "text",
                  text: JSON.stringify({
                      outline: cached.outline,
                      originalLength: cached.originalLength,
                      outlineLength: cached.outlineLength,
                      cacheStatus: "hit"
                  }, null, 2)
              }]
          };
      }

      const result = getCodeOutline(source, lang, { focusedSymbols: focused });
      
      astCache.set(path, lang, source, focused, result.outline, result.originalLength, result.outlineLength);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
              outline: result.outline,
              originalLength: result.originalLength,
              outlineLength: result.outlineLength,
              cacheStatus: "miss"
          }, null, 2)
        }],
      };
    }

    if (request.params.name === "compress_output") {
      const args = request.params.arguments as any;
      const output = args.output;
      const tool = args.tool || "unknown";
      const maxTokens = args.maxTokens || config.maxPassthroughTokens;

      const result = await compress({
          output,
          toolName: tool,
          maxPassthroughTokens: maxTokens,
          timeoutMs: config.timeoutMs
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
              compressed: result.compressed,
              originalTokens: result.originalTokens,
              compressedTokens: result.compressedTokens,
              savedTokens: result.savedTokens,
              reductionPercent: result.reductionPercent,
              category: result.category
          }, null, 2)
        }],
      };
    }

    if (request.params.name === "get_token_savings") {
      const report = globalAnalyticsStore.getSavingsReport();
      // add ast cache stats
      const astStats = astCache.getStats();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
             ...report,
             astCacheStats: astStats
          }, null, 2)
        }],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Token Context Optimizer MCP server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error running MCP server:", error);
  process.exit(1);
});
