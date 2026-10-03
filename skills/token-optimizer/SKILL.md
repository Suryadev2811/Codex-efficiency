---
name: token-optimizer
description: Context window and token optimization skill for Codex CLI. Use when working with large codebases, analyzing massive tool outputs, or extracting structural AST outlines.
---

# Token Optimizer Skill

## Overview
The Token Optimizer minimizes unnecessary context window usage while preserving every piece of information that materially affects reasoning, debugging, implementation, or decision-making.

## Capabilities

### 1. AST Code Outlines (`get_code_outline`)
When exploring large repositories or unfamiliar modules, request a structural outline instead of reading full files:
- Preserves interfaces, classes, type declarations, and function signatures.
- Replaces un-focused implementation bodies with `// ... implementation omitted ...`.
- Supports focused symbols (e.g. `focusedSymbols: ["InvoiceService.processInvoice"]`) to preserve exact bodies for target functions while compacting surrounding code.

### 2. Output Compression (`compress_output`)
Automatically compresses verbose outputs from:
- **Git**: Keeps changed files, additions, deletions, and active hunks while dropping large unchanged context.
- **Tests (Jest, Pytest, Vitest)**: Keeps failure summaries, assertion errors, and relevant stack frames while dropping repetitive passing test output.
- **Build & Compilers (tsc, cargo)**: Keeps errors, warnings, diagnostic codes, and source context while omitting repetitive progress noise.
- **Stacktraces**: Collapses repetitive runtime/framework frames (e.g., `node_modules`, `site-packages`) while preserving the exception, message, and application-level frames.

### 3. Analytics & Telemetry (`get_token_savings`)
Inspect session-level optimization metrics:
- Original vs compressed token estimates.
- Cumulative saved tokens and reduction percentages.
- AST cache hit rates and compression latencies.
