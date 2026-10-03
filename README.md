# Token Context Optimizer for Codex

A high-performance, local-first context window optimizer designed to compress noisy tool outputs and extract structural AST outlines for Codex CLI. It strictly maximizes "useful context per token" while enforcing a hard `<800ms` fail-open execution bound.

## Features

- **Output Compression**: Aggressively compresses outputs from Git, Test Runners (Jest/Pytest), Compilers (tsc, cargo), Stacktraces, and Package Managers while fiercely preserving critical errors, failing lines, assertions, and hunks.
- **AST Structural Outliner**: Automatically transforms un-focused JavaScript, TypeScript, and Python code into structural outlines, stripping implementation bodies but keeping interfaces, classes, and signatures.
- **AST LRU Caching**: Uses SHA-256 fingerprinting to instantly return cached outlines on subsequent pipeline operations.
- **Local Analytics**: Exposes real-time token savings metrics and telemetry via MCP.
- **Secret Redaction**: Safely redacts API keys, Bearer tokens, and URL credentials from compressed tool outputs to prevent accidental leakage into the context window.
- **Fail-Open Architecture**: Every phase operates under an 800ms timeout boundary; any internal failure immediately falls back to returning the uncompressed input to Codex.

## Usage

The Token Context Optimizer operates transparently as an `AfterTool` and `PreCompress` hook natively inside the Codex CLI execution pipeline. Once installed, it intercepts verbose shell tool executions (e.g., `git diff` returning 2000 lines), compresses it down to the core additions/deletions, and injects the output back into the prompt context.

Additionally, it functions as an MCP server.

See [INSTALLATION.md](docs/INSTALLATION.md) for setup instructions.
See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for design details.
