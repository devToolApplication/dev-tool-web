# Shared MCP config for dev-tool-web

This repo uses the same MCP server pair for Claude, Codex, Gravity, Gemini, and the entire `D:\Code` workspace:
- `codegraph` for workspace-wide code intelligence
- `basic-memory` for shared project memory

Canonical repo manifest:
- [`.ai/shared-mcp.manifest.json`](./shared-mcp.manifest.json)

## Scope

- CodeGraph index root: `D:\Code`
- Primary project for current frontend work: `D:\Code\dev-tool-web`
- Basic Memory project: `dev-tool-web`

## Claude

Repo-local config already exists at:
- [`.claude/mcp.json`](../.claude/mcp.json)

User-level Claude MCP config should contain:

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    },
    "basic-memory": {
      "type": "stdio",
      "command": "C:\\Users\\Hello\\AppData\\Roaming\\Python\\Python314\\Scripts\\basic-memory.exe",
      "args": ["mcp", "--transport", "stdio", "--project", "dev-tool-web"]
    }
  }
}
```

## Codex

Added to user config:
- `C:\Users\Hello\.codex\config.toml`

Snippet:

```toml
[mcp_servers.codegraph]
command = "codegraph"
args = ["serve", "--mcp"]

[mcp_servers.basic-memory]
command = 'C:\\Users\\Hello\\AppData\\Roaming\\Python\\Python314\\Scripts\\basic-memory.exe'
args = ["mcp", "--transport", "stdio", "--project", "dev-tool-web"]
```

## Gravity

Gravity config location varies, so use this portable snippet and paste it into your Gravity MCP config file.

### JSON form

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    },
    "basic-memory": {
      "type": "stdio",
      "command": "C:\\Users\\Hello\\AppData\\Roaming\\Python\\Python314\\Scripts\\basic-memory.exe",
      "args": ["mcp", "--transport", "stdio", "--project", "dev-tool-web"]
    }
  }
}
```

### YAML form

```yaml
mcp_servers:
  codegraph:
    command: codegraph
    args:
      - serve
      - --mcp
    enabled: true

  basic-memory:
    command: C:\Users\Hello\AppData\Roaming\Python\Python314\Scripts\basic-memory.exe
    args:
      - mcp
      - --transport
      - stdio
      - --project
      - dev-tool-web
    enabled: true
```

## Gemini

Added to user config:
- `C:\Users\Hello\.gemini\config\mcp_config.json`

Snippet:

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    },
    "basic-memory": {
      "command": "C:\\Users\\Hello\\AppData\\Roaming\\Python\\Python314\\Scripts\\basic-memory.exe",
      "args": ["mcp", "--transport", "stdio", "--project", "dev-tool-web"]
    }
  }
}
```

## Maintenance

Run from anywhere:

```powershell
npm --prefix "D:\Code\dev-tool-web" run codegraph:status
npm --prefix "D:\Code\dev-tool-web" run codegraph:sync
npm --prefix "D:\Code\dev-tool-web" run codegraph:index
```

These scripts now operate on the workspace root `D:\Code`, not only on `dev-tool-web`.
