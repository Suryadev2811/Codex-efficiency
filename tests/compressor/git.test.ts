import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { compressGitOutput } from '../../src/compressor/git';

describe('Git Compressor', () => {
    it('should compress long unmodified blocks in diffs', () => {
        const diff = `diff --git a/test.ts b/test.ts
index abc..def
--- a/test.ts
+++ b/test.ts
@@ -1,10 +1,10 @@
 line 1
 line 2
 line 3
 line 4
 line 5
-line 6 removed
+line 6 added
 line 7
 line 8
 line 9
 line 10`;

        const result = compressGitOutput(diff);
        assert.ok(result.includes("line 6 added"), "Must preserve addition");
        assert.ok(result.includes("line 6 removed"), "Must preserve deletion");
        assert.ok(result.includes("... (unchanged lines omitted)"), "Must compress unchanged lines");
        assert.ok(!result.includes("line 1\nline 2\nline 3\nline 4"), "Must omit distant unchanged context");
    });
});
