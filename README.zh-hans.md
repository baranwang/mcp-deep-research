# MCP Deep Research

[![smithery badge](https://smithery.ai/badge/@baranwang/mcp-deep-research)](https://smithery.ai/server/@baranwang/mcp-deep-research)
[![NPM Version](https://img.shields.io/npm/v/mcp-deep-research)](https://www.npmjs.com/package/mcp-deep-research)
![NPM License](https://img.shields.io/npm/l/mcp-deep-research)

简体中文 | [English](README.md)

## 概述

MCP Deep Research 是一个用于网络信息搜索推理的工具。基于 [Model Context Protocol](https://modelcontextprotocol.com/) 和 [Tavily API](https://tavily.com/) 构建

## 配置

```jsonc
{
  "mcpServers": {
    "deep-research": {
      "command": "npx",
      "args": ["-y", "mcp-deep-research@latest"],
      "env": {
        "TAVILY_API_KEY": "your_tavily_api_key", // 必填
        "MAX_SEARCH_KEYWORDS": "5", // 可选，默认 5
        "MAX_PLANNING_ROUNDS": "5" // 可选，默认 5
      }
    }
  }
}
```

可以通过以下环境变量配置该工具：

- `TAVILY_API_KEY`：[Tavily](https://tavily.com/) API 的密钥
- `MAX_SEARCH_KEYWORDS`：使用的最大搜索关键词数量
- `MAX_PLANNING_ROUNDS`：使用的最大规划轮次数

### 通过 Smithery 使用

通过 [Smithery](https://smithery.ai/server/@baranwang/mcp-deep-research) 安装，兼容 Claude Desktop 客户端：

```bash
npx -y @smithery/cli install @baranwang/mcp-deep-research --client claude
```

## 兼容性说明

此 MCP 服务针对基于提示词实现的 MCP 客户端而生。对于使用 Function Calling 机制实现的 MCP 客户端，其结果可能不够理想。

已验证过基于提示词的 MCP 客户端：

- [Claude Desktop](https://claude.ai/download)
- [Cursor](https://www.cursor.com/)
- [Cline](https://github.com/cline/cline)
- [ChatWise](https://chatwise.app/)

已验证过使用 Function Calling 机制实现的 MCP 客户端：

- [Cherry Studio](https://cherry-ai.com/)
