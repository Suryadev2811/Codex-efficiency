# Codex Runtime Discovery Report

## Environment
* **OS:** Windows (win32)
* **Codex version:** 0.62.0 (Codex CLI)
* **Node version:** v22.22.0
* **Python version:** 3.13.12
* **npm version:** 11.9.0

## Runtime Findings

### Plugin Support
Codex CLI (Codex) currently does not have a formal `plugin.json` architecture loaded dynamically like traditional IDE plugins, however, it natively supports an **Extension System** and a **Hooks System**. The source code `chunk-I47WLEEQ.js` clearly outlines an `ExtensionManager` that parses and loads extension config and its associated `.json` hook configurations.

### Hook Schema
Extensions provide hooks via `hooks/hooks.json`. The hook file structure observed natively:
```json
{
  "name": "extension-name",
  "version": "1.0.0",
  "hooks": {
    "AfterTool": [
      {
        "name": "Hook Name",
        "command": "node some-script.js"
      }
    ]
  }
}
```

### Supported Events
The `HookEventName` enum in the source maps internal names to string identifiers:
* `BeforeTool`
* `AfterTool`
* `BeforeAgent`
* `AfterAgent`
* `SessionStart`
* `SessionEnd`
* `PreCompress`
* `BeforeModel`
* `AfterModel`
* `BeforeToolSelection`

*Crucially*, the `PostToolUse` event described in the prompt maps internally to **`AfterTool`**. The `PreCompact` event maps to **`PreCompress`**.

### `AfterTool` (PostToolUse) Behavior
* The hook is triggered after a tool executes but before the result is submitted to the LLM.
* Payload sent to the hook via stdin (`tests/runtime/codex-post-tool-probe.js` inspection confirms the payload shape contains at minimum `{"event": "AfterTool", "toolName": ...}`).

### Hook Output / Injection Capabilities
* **Exit 2 Behavior**: Verified. Exiting with code `2` and writing to `stderr` stops the agent execution and injects the stop reason (`Agent execution stopped by hook: [stderr message]`). This operates effectively as a circuit breaker but *not* as a context modifier.
* **Structured JSON stdout**: Verified. Writing structured JSON with a zero exit code successfully injects metadata. Specifically, emitting:
  ```json
  {
      "hookSpecificOutput": {
          "hookEventName": "AfterTool",
          "additionalContext": "SOME CONTEXT"
      }
  }
  ```
  results in Codex appending `<hook_context>SOME CONTEXT</hook_context>` directly to the `llmContent` of the tool result. *This is the required integration mechanism for altering model context.*
* **Decision: "block"**: Verified. Returning `{"decision": "block", "reason": "something"}` successfully intercepts the execution. The model sees `Tool result blocked: something`.

### Interactive vs Exec
The hooks infrastructure evaluates identically across headless interactions (`-p` / pipes) and interactive mode. However, certain tools (like `run_shell_command`) are blocked by security boundaries depending on the execution trust context (`--skip-trust` disables some safeguards, but pure piped prompts disable shell tools to prevent RCE).

### Windows Behavior
Windows pipes to Node `process.stdin` work perfectly. The payload parses without error. The standard output correctly transmits JSON back to Codex. Path resolution inside extensions must be wary of Windows `\` separators, though the extension loader (`recursivelyHydrateStrings`) manually injects `pathSeparator: path.sep`.

## Summary
The **Strategy B** mechanism is validated and selected. We will implement `AfterTool` hooks that parse `stdin`, execute the optimizer logic, and return `{"hookSpecificOutput": {"hookEventName": "AfterTool", "additionalContext": "<compressed>"}}`.
