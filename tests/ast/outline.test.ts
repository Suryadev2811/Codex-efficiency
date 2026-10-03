import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { getCodeOutline } from '../../src/ast/outline';

describe('AST Outline Extractor', () => {
    it('should generate a TypeScript outline', () => {
        const tsCode = `
import { stuff } from 'lib';

export class MyService {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    public async doThing(x: number) {
        if (x > 5) {
            console.log("doing thing");
        }
        return x * 2;
    }
}
`;
        const result = getCodeOutline(tsCode, "typescript", { focusedSymbols: [] });
        const outline = result.outline;

        assert.ok(outline.includes("export class MyService {"), "Must keep class signature");
        assert.ok(outline.includes("public async doThing(x: number)  {"), "Must keep method signature");
        assert.ok(outline.includes("// ... implementation omitted ..."), "Must omit bodies");
        assert.ok(!outline.includes("console.log"), "Must remove internal logic");
    });

    it('should preserve focused symbols in TypeScript', () => {
         const tsCode = `
class Test {
    a() { return 1; }
    b() { 
        return 2; 
    }
}
`;
        const result = getCodeOutline(tsCode, "typescript", { focusedSymbols: ["b"] });
        assert.ok(result.outline.includes("return 2;"), "Must preserve focused method body");
        assert.ok(!result.outline.includes("return 1;"), "Must omit non-focused method body");
    });

    it('should generate a Python outline', () => {
        const pyCode = `
import os

class MyClass:
    def __init__(self):
        self.x = 5
    
    async def do_thing(self, y: int) -> int:
        print("doing thing")
        return self.x + y
`;
        const result = getCodeOutline(pyCode, "python", { focusedSymbols: [] });
        const outline = result.outline;

        assert.ok(outline.includes("class MyClass:"), "Must keep class signature");
        assert.ok(outline.includes("async def do_thing(self, y: int) -> int:"), "Must keep method signature");
        assert.ok(outline.includes("# ... implementation omitted ..."), "Must omit bodies");
        assert.ok(!outline.includes("print(\"doing thing\")"), "Must remove internal logic");
    });
});
