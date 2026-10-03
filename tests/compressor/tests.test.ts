import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { compressTestOutput } from '../../src/compressor/tests';

describe('Test Compressor', () => {
    it('should compress consecutive passing tests', () => {
        const output = `
PASS src/1.test.ts
PASS src/2.test.ts
PASS src/3.test.ts
PASS src/4.test.ts
PASS src/5.test.ts
FAIL src/6.test.ts
  ● Test 6 › fails horribly
    Expected: 1
    Received: 2
      at Object.<anonymous> (src/6.test.ts:4:15)
PASS src/7.test.ts
Test Suites: 1 failed, 6 passed, 7 total
`;
        // Duplicate lines to trigger threshold
        const longOutput = output.repeat(10);
        const result = compressTestOutput(longOutput);
        
        assert.ok(result.includes("... (passing tests omitted)"), "Must compress passes");
        assert.ok(result.includes("FAIL src/6.test.ts"), "Must preserve failure");
        assert.ok(result.includes("Expected: 1"), "Must preserve assertion details");
        assert.ok(result.includes("at Object.<anonymous>"), "Must preserve stack traces");
    });
});
