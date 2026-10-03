import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { compressBuildOutput } from '../../src/compressor/build';

describe('Build Compressor', () => {
    it('should compress progress bars but keep errors', () => {
        const output = `
[1/100] Compiling a.ts
[2/100] Compiling b.ts
[3/100] Compiling c.ts
[4/100] Compiling d.ts
[5/100] Compiling e.ts
error TS2322: Type 'string' is not assignable to type 'number'.
  src/c.ts:5:14
    5 const x: number = "hello";
[6/100] Compiling f.ts
[7/100] Compiling g.ts
[8/100] Compiling h.ts
`.repeat(10); // make it long enough to trigger 100 line check

        const result = compressBuildOutput(output);
        assert.ok(result.includes("... (build progress omitted)"), "Must compress progress");
        assert.ok(result.includes("error TS2322:"), "Must preserve error");
        assert.ok(result.includes("src/c.ts:5:14"), "Must preserve error file location");
        assert.ok(!result.includes("[4/100]"), "Must remove intermediate progress");
    });
});
