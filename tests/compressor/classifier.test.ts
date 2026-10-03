import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { classifyOutput } from '../../src/compressor/classifier';

describe('Classifier', () => {
    it('should classify git output', () => {
        assert.strictEqual(classifyOutput("diff --git a/file b/file\nindex 00..11"), "git");
        assert.strictEqual(classifyOutput("On branch main\nChanges not staged for commit:"), "git");
    });

    it('should classify test output', () => {
        assert.strictEqual(classifyOutput("FAIL src/app.test.ts\n  ● App › renders"), "test");
        assert.strictEqual(classifyOutput("Test Suites: 1 failed, 1 total"), "test");
    });

    it('should classify build output', () => {
        assert.strictEqual(classifyOutput("Compiling 140 files with tsc..."), "build");
        assert.strictEqual(classifyOutput("cargo build\n   Compiling test v0.1.0"), "build");
    });

    it('should classify stacktrace output', () => {
        assert.strictEqual(classifyOutput("Traceback (most recent call last):\n  File \"app.py\", line 10"), "stacktrace");
        assert.strictEqual(classifyOutput("TypeError: Cannot read property\n    at Object.<anonymous> (/app/index.js:4:15)"), "stacktrace");
    });

    it('should classify search output', () => {
        assert.strictEqual(classifyOutput("src/app.ts:14: const x = 5;\nsrc/app.ts:22: const y = 10;"), "search");
    });

    it('should classify package manager output', () => {
        assert.strictEqual(classifyOutput("npm install\nadded 50 packages, and audited 51 packages in 2s"), "package-manager");
    });

    it('should fall back to generic', () => {
        assert.strictEqual(classifyOutput("Hello world\nThis is a standard log."), "generic");
    });
});
