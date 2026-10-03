# Architecture

The Token Context Optimizer utilizes the native Hooks extension system found inside the Codex CLI.

## Hook Pipeline: Post-Tool Use (`AfterTool`)

When the Codex engine executes a tool (like `run_shell_command`), the hook intercepts the `stdout` before it reaches the model:

```text
Codex
  ↓ (Raw Output)
AfterTool Hook (bin/post-tool-use.js)
  ↓
Classifier (Regex/Heuristic Analysis)
  ↓
Compressor
  ├── Git (Preserves additions/deletions, drops unchanged hunks)
  ├── Test (Preserves FAIL, stacktraces, assertion errors)
  ├── Build (Preserves ERROR, WARNING, path locations)
  ├── Stacktrace (Collapses node_modules / site-packages)
  └── Generic (Deduplicates middle chunks)
  ↓
Critical Information Validator
  ↓ (Revert if validation fails)
Optimized Context
  ↓ (Injected via JSON hookSpecificOutput.additionalContext)
Codex
```

## AST Outline Architecture (`get_code_outline`)

The MCP Server exposes an AST Outline tool that operates on source code files. Instead of loading heavy compiler toolchains, it uses intelligent heuristic AST matching.

```text
Source File
  ↓
Language Detection (TS/JS/Python)
  ↓
AST Hash Check (SHA-256)
  ↓ [Miss]
AST Parser (Regex Structural Analyzer)
  ↓
Symbol Selection (Focus mode handling)
  ↓
Outline / Focused Source
  ↓
AST Cache
  ↓
Codex
```

## Fail-Open Principles

* **Timeout**: Enforced `Promise.race` against an 800ms timer.
* **Exceptions**: Any `JSON.parse` or processing error calls `process.exit(0)`, effectively returning unmodified state back to Codex.
