export function compressGenericOutput(output: string): string {
    const lines = output.split('\n');
    if (lines.length <= 150) return output;

    const result: string[] = [];
    
    // Always preserve the very beginning and very end (header/summary)
    const PRESERVE_START = 30;
    const PRESERVE_END = 30;

    let duplicateCount = 0;
    let lastLine = "";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Guaranteed boundaries
        if (i < PRESERVE_START || i >= lines.length - PRESERVE_END) {
            // Still do basic deduplication even in preserved zones if it's crazy repetitive
            if (line === lastLine && line.trim() !== "") {
                duplicateCount++;
                if (duplicateCount <= 2) {
                     result.push(line);
                } else if (duplicateCount === 3) {
                     result.push(`... (repeated line omitted)`);
                }
            } else {
                duplicateCount = 0;
                result.push(line);
                lastLine = line;
            }
            continue;
        }

        // We are in the compressible middle block.
        // Check for critical structural/error signals.
        const lower = line.toLowerCase();
        const isImportant = 
            lower.includes("error") || 
            lower.includes("fatal") || 
            lower.includes("warning") ||
            lower.includes("failed") ||
            lower.includes("exception") ||
            /^\s*at\s+/.test(lower) || // stack traces
            line.trim().startsWith("#") || // markdown headers
            /^[\w\/\.\-]+\:\d+/.test(line); // file paths

        if (isImportant) {
            // Output it, and reset repetition counter
            if (line === lastLine && line.trim() !== "") {
                 duplicateCount++;
                 if (duplicateCount <= 2) result.push(line);
            } else {
                 duplicateCount = 0;
                 result.push(line);
                 lastLine = line;
            }
            continue;
        }

        // If it's not important, and we're in the middle, we compress aggressively
        // We'll keep a snippet of context before/after important things, but for generic
        // we'll just omit it with a placeholder if it spans many lines
        
        if (result.length > 0 && !result[result.length - 1].startsWith("... (")) {
            result.push(`... (unremarkable generic lines omitted) ...`);
        }
    }

    return result.join('\n');
}
