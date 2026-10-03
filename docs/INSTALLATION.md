# Installation Guide

The Token Context Optimizer is designed for Codex (Codex CLI) on Windows.

## 1. Build from Source

Open PowerShell and clone the repository to your machine.

```powershell
# Clone the repository
git clone <repository_url> token-context-optimizer
cd token-context-optimizer

# Install dependencies
npm install

# Compile the TypeScript binaries
npm run build

# Run unit tests to verify
npm test
```

## 2. Codex / Codex CLI Integration

Codex CLI v0.62.0 natively looks for `.codex-plugin/plugin.json` or `plugin.json` and a `hooks/hooks.json` in directories registered as extensions or workspaces. 

Because Codex CLI uses an `ExtensionManager`, the simplest integration path is to register this directory as a local extension. Alternatively, as a workspace, Codex automatically reads the `hooks/hooks.json` manifest.

### Integrating the Hooks
The `hooks/hooks.json` file is pre-configured to execute:
`node ${PLUGIN_ROOT}/bin/post-tool-use.js`

### Configuring MCP
You can natively register the `token-optimizer` MCP Server. Open your `settings.json` (usually `~/.codex/settings.json`) and append the local MCP server path:
```json
{
  "mcp": {
    "servers": {
      "token-optimizer": {
        "command": "node",
        "args": ["C:/absolute/path/to/token-context-optimizer/bin/optimizer-mcp.js"]
      }
    }
  }
}
```

## Verification

To verify the `AfterTool` hook is running, execute a command with large output in the Codex CLI, such as:

```powershell
"Use run_shell_command to execute: node -e \"console.log('PASS\\n'.repeat(200)); console.log('FAIL\\nExpected: 1')\"" | codex --skip-trust -p
```
You should see the optimized context inject back into the tool response.
