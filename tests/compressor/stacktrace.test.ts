import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { compressStacktraceOutput } from '../../src/compressor/stacktrace';

describe('Stacktrace Compressor', () => {
    it('should collapse framework frames while preserving exceptions and app frames', () => {
        const output = `
TypeError: Cannot read properties of undefined
    at ApplicationCode.run (src/app.ts:42:15)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1159:10)
    at Module.load (node:internal/modules/cjs/loader:981:32)
    at Function.Module._load (node:internal/modules/cjs/loader:822:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:77:12)
    at node:internal/main/run_main_module:17:47
Caused by: Error: Sub failure
    at SomeLibrary.doThing (node_modules/lib/index.js:10:5)
`.repeat(10); // repeat to exceed threshold

        const result = compressStacktraceOutput(output);
        
        assert.ok(result.includes("TypeError: Cannot read properties"), "Must preserve exception message");
        assert.ok(result.includes("at ApplicationCode.run"), "Must preserve application frame");
        assert.ok(result.includes("... ("), "Must insert collapse markers");
        assert.ok(result.includes("Caused by: Error:"), "Must preserve caused-by");
        assert.ok(!result.includes("Function.executeUserEntryPoint"), "Should collapse deep internal frames");
    });
});
