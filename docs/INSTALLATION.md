# Installation Guide

**Token Context Optimizer** provides native plugin and marketplace integration for **Codex CLI 0.160.0+**.

---

## Prerequisites

Before installing, ensure the following tools are available on your system:

1. **Codex CLI**: Version `0.160.0` or higher
   ```powershell
   codex --version
   ```
2. **Node.js**: Version `18.0.0` or higher (LTS recommended)
   ```powershell
   node --version
   ```
3. **Git**:
   ```powershell
   git --version
   ```

---

## 1. Remote Installation (Direct from GitHub)

You can install Token Context Optimizer directly from GitHub using Codex's native marketplace management commands:

### Step 1: Register the Repository as a Marketplace
```powershell
codex plugin marketplace add https://github.com/Suryadev2811/token-context-optimizer
```

### Step 2: Install the Plugin
```powershell
codex plugin add token-context-optimizer@token-context-optimizer
```

Codex will automatically:
- Download and cache the plugin to `~/.codex/plugins/cache/token-context-optimizer/token-context-optimizer/<version>/`.
- Register and enable the plugin in `~/.codex/config.toml`.
- Auto-discover and register the `token-context-optimizer` MCP server configured in `.mcp.json`.
- Discover and expose the `token-optimizer` skill.
- Stage the plugin hooks defined in `hooks/hooks.json`.

---

## 2. Local / Offline Installation

If you are developing locally or installing from a cloned repository:

### Step 1: Clone and Build
```powershell
git clone https://github.com/Suryadev2811/token-context-optimizer.git
cd token-context-optimizer

# Install dependencies and build TypeScript binaries
npm install
npm run build
```

### Step 2: Register Local Directory as a Marketplace
From the repository root directory:
```powershell
codex plugin marketplace add ./
```

### Step 3: Install the Plugin
```powershell
codex plugin add token-context-optimizer@token-context-optimizer
```

---

## 3. First-Time Hook Trust Approval

Codex enforces a security gate for external plugin hooks:

1. **Interactive Session Prompt:**
   When you start your first interactive Codex session (`codex`), Codex will detect the newly registered hooks (`PostToolUse` and `PreCompact`) and prompt you for trust approval.
2. **Accept the Prompt:**
   Confirm the prompt to approve the plugin hooks. Codex calculates the SHA-256 hash of the hook commands and persists the trust decision in `~/.codex/config.toml` under `[hooks.state]`.
3. **Security Note:**
   Hook trust is never bypassed automatically. You must approve the prompt once per installation. (The `--dangerously-bypass-hook-trust` flag is reserved for non-interactive test harnesses and must not be used in normal workflows).

---

## 4. Verification

Verify that the plugin, MCP server, and skills are successfully installed and active:

### Verify Plugin Status
```powershell
codex plugin list
```
You should see:
```text
PLUGIN                                                 STATUS              VERSION
token-context-optimizer@token-context-optimizer        installed, enabled  1.1.0
```

### Verify MCP Auto-Registration
```powershell
codex mcp list
codex mcp get token-context-optimizer --json
```
The server will appear with status `enabled`, using `command: "node"`, pointing to `./bin/optimizer-mcp.js` inside `${PLUGIN_ROOT}`.

### Verify Runtime Hook Operation
Run the built-in runtime probe to verify end-to-end hook processing:
```powershell
npm run test:runtime
```

---

## 5. Upgrades and Updates

To update the plugin when new releases are pushed:

```powershell
codex plugin marketplace upgrade token-context-optimizer
```

---

## 6. Removal and Uninstallation

To completely remove Token Context Optimizer:

### Step 1: Remove the Plugin
```powershell
codex plugin remove token-context-optimizer@token-context-optimizer
```

### Step 2: Remove the Marketplace Source
```powershell
codex plugin marketplace remove token-context-optimizer
```

This removes all cached files, unregisters the MCP server, and cleans up the corresponding entries in `~/.codex/config.toml`.
