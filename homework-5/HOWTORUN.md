# How to Run — Homework 5 MCP Setup

This guide walks you through installing dependencies, running the custom MCP server, registering all four servers with Claude Code, and testing the `read` tool.

---

## Prerequisites

- **Python 3.12** (or newer) — installed via Homebrew
- **Node.js 20+** — for running npm-based MCP servers
- **Claude Code** — CLI or desktop app

### Install Python 3.12 (if not already installed)

```bash
brew install python@3.12
```

Verify installation:

```bash
/usr/local/opt/python@3.12/bin/python3.12 --version
```

---

## Step 1: Set Up the Custom MCP Server

### 1.1 Create a Virtual Environment

Navigate to the custom-mcp-server directory and create a venv:

```bash
cd homework-5/src/custom-mcp-server
/usr/local/opt/python@3.12/bin/python3.12 -m venv .venv
source .venv/bin/activate
```

### 1.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This installs `fastmcp==3.4.2` and its dependencies.

### 1.3 Verify the Server Works

Test the `read` tool locally:

```bash
python3 << 'EOF'
from server import read

# Test with default 30 words
result = read()
print(f"read() returned {len(result.split())} words:\n{result}\n")

# Test with 5 words
result = read(5)
print(f"read(5) returned {len(result.split())} words:\n{result}")
EOF
```

Expected output:
- `read()` returns exactly 30 words
- `read(5)` returns exactly 5 words

---

## Step 2: Prepare Environment Variables

### 2.1 Copy the Template

```bash
cd /path/to/homework-5/src
cp .env.example .env
```

### 2.2 Add Your Credentials

Edit `.env` and fill in your credentials:

```bash
# GitHub PAT
# Go to https://github.com/settings/tokens
# Create a fine-grained Personal Access Token with 'repo' read scope
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Choose ONE: Notion OR Jira (not both)

# OPTION A: Notion
# Go to https://www.notion.so/my-integrations
# Create an internal integration and copy the token
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OPTION B: Jira
# Set your Jira site URL
JIRA_SITE_URL=https://mycompany.atlassian.net
# Your Jira email
JIRA_EMAIL=user@company.com
# Create an API token at https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_API_TOKEN=atatt_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Load Environment Variables

Before running Claude Code, source your `.env`:

```bash
export $(cat .env | xargs)
```

Or, add to your shell profile (`.zshrc`, `.bashrc`, etc.) to load automatically.

---

## Step 3: Register MCP Servers with Claude Code

### Option A: Using `claude mcp add` (Recommended)

Claude Code registers servers with `claude mcp add [options] <name> <command> [args...]`.
The command goes **after `--`**, and env vars are passed with `-e KEY=value`.
First load your tokens from `.env`, then add each server:

```bash
cd /Users/admin/gen-ai-homeworks/gen-ai-software-engineering/homework-5/src

# Load tokens into the current shell
export $(grep -v '^#' .env | xargs)

claude mcp add github -s user -e GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PERSONAL_ACCESS_TOKEN \
  -- npx -y @modelcontextprotocol/server-github

claude mcp add filesystem -s user \
  -- npx -y @modelcontextprotocol/server-filesystem /Users/admin/gen-ai-homeworks/gen-ai-software-engineering/homework-5/src

claude mcp add notion -s user -e NOTION_TOKEN=$NOTION_TOKEN \
  -- npx -y @notionhq/notion-mcp-server

claude mcp add custom-mcp -s user \
  -- /usr/local/opt/python@3.12/libexec/bin/python /Users/admin/gen-ai-homeworks/gen-ai-software-engineering/homework-5/src/custom-mcp-server/server.py
```

> `-s user` installs to your global config so the servers work regardless of which
> directory Claude Code opens. Use `-s project` instead to write into a local `.mcp.json`.

### Option B: Committed `.mcp.json` (this repo's deliverable)

This repo ships `src/.mcp.json` documenting all four servers with `${VAR}` secret
references. When Claude Code is launched from a directory containing `.mcp.json`, it
detects the file and prompts to enable the servers — no manual `add` needed.

### 3.1 Verify Registration

Check that all servers are registered and connected:

```bash
claude mcp list
```

Expected output (all servers should show **connected**):
```
github ............ connected
filesystem ....... connected
notion ........... connected  (or jira, depending on your choice)
custom-mcp ....... connected
```

---

## Step 4: Test the Custom Server's `read` Tool

Once the custom server is registered, you can test it in Claude Code.

### In Claude Code / Chat

Ask Claude to use the `read` tool:

```
Can you call the read tool with word_count=10 and show me the result?
```

Expected: Claude returns exactly 10 words from `lorem-ipsum.md`:
```
# Lorem Ipsum Lorem ipsum dolor sit amet, consectetur adipiscing
```

### Testing the Resource (Advanced)

You can also test the **resource** directly if the MCP client supports resource reading. The resource URI is:

```
lorem://words/{word_count}
```

For example: `lorem://words/15` returns the first 15 words.

---

## Troubleshooting

### Custom Server Not Connecting

**Error**: `custom-mcp ... error` when running `claude mcp list`

**Solution**:
1. Verify the Python path exists: `/usr/local/opt/python@3.12/libexec/bin/python`
2. Check that `.venv` was created and dependencies installed: `ls src/custom-mcp-server/.venv`
3. Test the server manually: `cd src/custom-mcp-server && source .venv/bin/activate && python server.py` (will hang waiting for MCP messages — Ctrl+C to exit)

### GitHub Server: Authentication Failed

**Error**: `GITHUB_PERSONAL_ACCESS_TOKEN not set` or `Invalid token`

**Solution**:
1. Generate a new fine-grained PAT at https://github.com/settings/tokens
2. Ensure it has **repo (read)** scope
3. Copy the full token (starts with `ghp_`)
4. Update `.env` and reload: `export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...`

### Notion/Jira Server: Cannot Connect

**Error**: `NOTION_TOKEN not found` or `JIRA authentication failed`

**Solution**:
1. For **Notion**: Go to https://www.notion.so/my-integrations, create an integration, and share it with your target database
2. For **Jira**: Verify your site URL (e.g., `https://yourcompany.atlassian.net`), email, and API token
3. Verify the token is copied correctly — paste it into `.env`

### Filesystem Server: Path Not Found

**Error**: `filesystem ... path does not exist`

**Solution**:
- The filesystem server is configured to serve `/Users/admin/gen-ai-homeworks/gen-ai-software-engineering/homework-5/src`
- Verify this path exists on your system
- If your path is different, edit `src/.mcp.json` and update the path

---

## Next Steps

1. **Capture screenshots** of each MCP server in action:
   - **GitHub**: List recent PRs or commits from `mykolab316/gen-ai-software-engineering`
   - **Filesystem**: List files under `homework-5/`
   - **Notion/Jira**: Query "last 5 bugs" on a project
   - **Custom**: Call the `read` tool with `word_count=10`
2. **Save screenshots** to `docs/screenshots/` with these names:
   - `github-mcp-result.png`
   - `filesystem-mcp-result.png`
   - `jira-or-notion-mcp-result.png`
   - `custom-mcp-read-tool-result.png`
3. **Commit all files** to git:
   ```bash
   git add .
   git commit -m "Configure MCP servers: GitHub, Filesystem, Jira/Notion, Custom FastMCP"
   ```
4. **Submit** as a pull request or per course instructions

---

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `cd src/custom-mcp-server && pip install -r requirements.txt` |
| Load env vars | `export $(cat src/.env \| xargs)` |
| List MCP servers | `claude mcp list` |
| Test custom server | `python -c "from server import read; print(read(10))"` |
| Verify Python path | `/usr/local/opt/python@3.12/libexec/bin/python --version` |

---

## Summary

1. ✅ Install Python 3.12
2. ✅ Set up the custom MCP server venv
3. ✅ Fill in `.env` with your credentials
4. ✅ Register all four servers with Claude Code
5. ✅ Test the `read` tool


Good luck! 🚀
