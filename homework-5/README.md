# Homework 5: Configure MCP Servers

**Author**: Mykola Bernadskyi

## Overview

This assignment demonstrates connecting Claude Code to **four Model Context Protocol (MCP) servers**: GitHub, Filesystem, Jira or Notion, and a custom FastMCP server. Each server exposes tools and resources that Claude can query and interact with.

## What is MCP?

**MCP (Model Context Protocol)** enables AI models to safely read and write from external systems. There are two key concepts:

### Resources
Resources are **URIs that Claude can read from** — like files, APIs, or databases. They provide data without requiring Claude to call a function. Think of them as "things Claude can look at."

**Example**: A resource `file://~/projects/README.md` lets Claude read the contents of a file directly, or `weather://nyc/current` returns the current weather for NYC.

### Tools
Tools are **actions Claude can call** to perform operations. They accept input parameters and return results. Think of them as "things Claude can do."

**Example**: A tool `send_email(to, subject, body)` sends an email, or `read(word_count=30)` returns 30 words from a file.

---

## The Four MCP Servers

### 1. GitHub MCP ⭐
Connects Claude to your GitHub account. Allows querying repositories, listing pull requests, viewing commits, and more.

**Configured server**: `@modelcontextprotocol/server-github`  
**Requires**: GitHub Personal Access Token (PAT)

### 2. Filesystem MCP ⭐
Exposes a directory on your machine so Claude can list files and read content.

**Configured server**: `@modelcontextprotocol/server-filesystem`  
**Path**: Points to `homework-5/src/` directory

### 3. Jira or Notion MCP ⭐⭐
Query tickets (Jira) or pages (Notion) from a real project.

**GitHub option 1**: `@notionhq/notion-mcp-server` (Notion)  
**Jira option 2**: `@aashari/mcp-server-atlassian-jira` (Jira)  
**Requires**: Notion token or Jira API credentials

### 4. Custom MCP Server ⭐⭐⭐
A FastMCP server that demonstrates both **tools** and **resources**:
- **Tool**: `read(word_count=30)` — returns the first `word_count` words from `lorem-ipsum.md`
- **Resource**: `lorem://words/{word_count}` — same as the tool, but accessed as a resource URI

---

## Project Structure

```
homework-5/
├── README.md                     (this file)
├── HOWTORUN.md                   (setup & usage instructions)
├── TASKS.md                      (assignment requirements)
├── .gitignore                    (keeps .env secrets out of git)
├── src/
│   ├── .mcp.json                 (MCP server configurations)
│   ├── .env.example              (template for environment variables)
│   └── custom-mcp-server/
│       ├── server.py             (FastMCP server: read tool + lorem resource)
│       ├── lorem-ipsum.md        (source text for the resource)
│       ├── .venv/                (Python virtual environment)
│       └── requirements.txt      (pinned fastmcp==3.4.2)
└── docs/
    └── screenshots/
        ├── github-mcp-result.png         (screenshot of GitHub query result)
        ├── filesystem-mcp-result.png     (screenshot of Filesystem listing)
        ├── jira-or-notion-mcp-result.png (screenshot of bug query result)
        └── custom-mcp-read-tool-result.png (screenshot of read tool call)
```

---

## Screenshots

See `docs/screenshots/` for results of each MCP server interaction:

1. **GitHub**: Query recent commits or pull requests on the repository
2. **Filesystem**: List and summarize files under `homework-5/`
3. **Jira/Notion**: Query the last 5 bugs on a project
4. **Custom**: Call the `read` tool with a specific word count

---

## Getting Started

See [HOWTORUN.md](./HOWTORUN.md) for:
- Prerequisites and installation
- How to run the custom MCP server
- How to register all four servers with Claude Code
- How to test the `read` tool

---

## Key Files

| File | Purpose |
|------|---------|
| `src/.mcp.json` | MCP server configuration (secrets via `${ENV}` references) |
| `src/.env.example` | Template showing which environment variables are needed |
| `src/.env` | **Local only** — contains your actual credentials (git-ignored) |
| `src/custom-mcp-server/server.py` | FastMCP server implementation |
| `src/custom-mcp-server/requirements.txt` | Python dependencies (includes `fastmcp==3.4.2`) |

---

## Notes

- All external MCP servers are **npm packages** (GitHub, Filesystem, Jira, Notion) and run via `npx`.
- The **custom server** runs as a Python subprocess using Python 3.12.
- Secrets (GitHub PAT, Notion token, Jira API token) are **never hard-coded** — they're referenced via `${VARIABLE}` in `.mcp.json` and loaded from your shell environment or `.env` file.
- See [HOWTORUN.md](./HOWTORUN.md) for detailed setup instructions.
