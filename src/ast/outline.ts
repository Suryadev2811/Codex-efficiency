import Parser from 'tree-sitter';
import ts from 'tree-sitter-typescript';
import js from 'tree-sitter-javascript';
import py from 'tree-sitter-python';

export interface OutlineOptions {
    focusedSymbols?: string[];
}

export interface OutlineResult {
    originalLength: number;
    outlineLength: number;
    outline: string;
}

export function getCodeOutline(source: string, language: string, options: OutlineOptions = {}): OutlineResult {
    const lang = language.toLowerCase();
    const focused = options.focusedSymbols || [];

    const parser = new Parser();

    if (lang === 'typescript' || lang === 'ts' || lang === 'tsx') {
        // tree-sitter-typescript exports { typescript, tsx }
        parser.setLanguage((ts as any).typescript || ts);
    } else if (lang === 'javascript' || lang === 'js' || lang === 'jsx') {
        parser.setLanguage(js);
    } else if (lang === 'python' || lang === 'py') {
        parser.setLanguage(py);
    } else {
        // Fallback for unsupported languages
        return {
            originalLength: source.length,
            outlineLength: source.length,
            outline: source
        };
    }

    const tree = parser.parse(source);
    
    // We walk the tree and replace bodies of top-level or class-level
    // declarations with "// ... implementation omitted ..." unless the
    // name of the declaration is in the focusedSymbols array.

    // A simpler approach with ASTs: 
    // We collect ranges to "omit", sort them, and then slice the original string.
    const rangesToOmit: { start: number, end: number, omitText: string }[] = [];

    const omitBody = (node: Parser.SyntaxNode, name: string | null) => {
        if (name && focused.includes(name)) {
            return; // focused, do not omit
        }

        // Find the block or statement block
        let bodyNode: Parser.SyntaxNode | null = null;
        for (const child of node.children) {
            if (child.type === 'statement_block' || child.type === 'block') {
                bodyNode = child;
                break;
            } else if (child.type === ':') {
                // python might have a block next
                const block = node.children.find(c => c.type === 'block');
                if (block) bodyNode = block;
            }
        }

        if (bodyNode) {
            let omitText = " // ... implementation omitted ... ";
            if (lang === "python" || lang === "py") {
                 omitText = "\n    # ... implementation omitted ...\n";
            } else {
                 omitText = " {\n    // ... implementation omitted ...\n} ";
            }
            
            rangesToOmit.push({
                start: bodyNode.startIndex,
                end: bodyNode.endIndex,
                omitText
            });
        }
    };

    const walk = (node: Parser.SyntaxNode) => {
        // Identify declaration nodes
        if (node.type === 'function_declaration' || node.type === 'method_definition' || node.type === 'function_definition') {
            let name = null;
            // find the identifier
            for (const child of node.children) {
                if (child.type === 'identifier' || child.type === 'property_identifier') {
                    name = child.text;
                    break;
                }
            }
            omitBody(node, name);
        } else if (node.type === 'class_declaration' || node.type === 'class_definition') {
            let name = null;
            for (const child of node.children) {
                if (child.type === 'identifier') {
                    name = child.text;
                    break;
                }
            }
            // If the whole class is focused, don't walk inside it to omit methods.
            if (name && focused.includes(name)) {
                return;
            }
        }
        
        for (const child of node.children) {
            walk(child);
        }
    };

    walk(tree.rootNode);

    // Sort ranges by start index, descending so we can safely splice from end to beginning
    rangesToOmit.sort((a, b) => b.start - a.start);

    let outline = source;
    for (const range of rangesToOmit) {
        outline = outline.substring(0, range.start) + range.omitText + outline.substring(range.end);
    }

    return {
        originalLength: source.length,
        outlineLength: outline.length,
        outline: outline
    };
}
