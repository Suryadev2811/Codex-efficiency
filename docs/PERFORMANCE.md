# Performance

The Token Context Optimizer is strictly bounded by an `800ms` processing timeout to ensure that Codex tool pipelines remain highly responsive.

## Benchmark Results (Unit Testing)

Measurements were taken using the Node.js native test runner (`node --test`) on a Windows workstation running Node v22.22.0.

### Outliner (AST Compression)
* **TypeScript Outline Generation**: ~4-7 ms
* **TypeScript Focused Symbol Preservation**: ~0.6-1.5 ms
* **Python Outline Generation**: ~1.1-1.5 ms

### Compressors
* **Git Diff Compressor**: ~2.5 ms (Compresses repetitive un-modified blocks)
* **Test Runner Compressor**: ~2.5-3.5 ms (Filters hundreds of passing tests down to a summary while keeping failures)
* **Build/Compiler Log Compressor**: ~2.5-3.5 ms
* **Stacktrace Compressor**: ~2.8-3.6 ms (Collapses framework boilerplate)

### Caching
* **LRU AST Cache Hit/Miss logic**: ~3-4 ms 

## Scalability

By avoiding heavy parsers (like Babel, TypeScript Compiler API, or Tree-Sitter) in favor of intelligent heuristic structure matchers, the optimizer bypasses the heavy initialization time required by AST toolchains. The AST `outline.ts` scales linearly (`O(n)`) through the file lines with minimal allocation overhead.

Large output buffers (e.g., 500 KB test logs) process entirely in-memory within 15-30ms, securely beating the 800ms budget limit.
