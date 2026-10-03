import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { AstCache } from '../../src/ast/cache';

describe('AST Cache', () => {
    it('should hit and miss correctly', () => {
        const cache = new AstCache(2);
        
        // Initial miss
        assert.strictEqual(cache.get("file.ts", "ts", "code", []), undefined);
        
        cache.set("file.ts", "ts", "code", [], "outline", 4, 7);
        
        // Hit
        const hit = cache.get("file.ts", "ts", "code", []);
        assert.ok(hit !== undefined);
        assert.strictEqual(hit.outline, "outline");
        
        // Miss due to different focused symbols
        assert.strictEqual(cache.get("file.ts", "ts", "code", ["func"]), undefined);
    });

    it('should evict LRU entries when max size is reached', () => {
        const cache = new AstCache(2);
        
        cache.set("f1.ts", "ts", "c", [], "o1", 1, 1);
        
        // artificially age f1
        const hit = cache.get("f1.ts", "ts", "c", []);
        if (hit) hit.lastAccessed = Date.now() - 1000;

        cache.set("f2.ts", "ts", "c", [], "o2", 1, 1);
        cache.set("f3.ts", "ts", "c", [], "o3", 1, 1); // Should evict f1
        
        assert.strictEqual(cache.get("f1.ts", "ts", "c", []), undefined, "f1 should be evicted");
        assert.ok(cache.get("f2.ts", "ts", "c", []) !== undefined, "f2 should still exist");
        assert.ok(cache.get("f3.ts", "ts", "c", []) !== undefined, "f3 should still exist");
    });
});
