# MCP Deep Research

[![smithery badge](https://smithery.ai/badge/@baranwang/mcp-deep-research)](https://smithery.ai/server/@baranwang/mcp-deep-research)
[![NPM Version](https://img.shields.io/npm/v/mcp-deep-research)](https://www.npmjs.com/package/mcp-deep-research)
![NPM License](https://img.shields.io/npm/l/mcp-deep-research)

## Overview

MCP Deep Research is a tool that allows you to search the web for information. It is built with the [Model Context Protocol](https://modelcontextprotocol.com/) and the [Tavily API](https://tavily.com/).

## Configuration

```json
{
  "mcpServers": {
    "deep-research": {
      "command": "npx",
      "args": ["-y", "mcp-deep-research@latest"],
      "env": {
        "TAVILY_API_KEY": "your_tavily_api_key",
        "MAX_SEARCH_KEYWORDS": "5",
        "MAX_PLANNING_ROUNDS": "5"
      }
    }
  }
}
```

The tool can be configured using the following environment variables:

- `TAVILY_API_KEY`: The API key for the [Tavily](https://tavily.com/) API.
- `MAX_SEARCH_KEYWORDS`: The maximum number of search keywords to use.
- `MAX_PLANNING_ROUNDS`: The maximum number of planning rounds to use.

### Use Smithery 

Install via [Smithery](https://smithery.ai/server/@baranwang/mcp-deep-research), compatible with Claude Desktop client:

```bash
npx -y @smithery/cli install @baranwang/mcp-deep-research --client claude
```