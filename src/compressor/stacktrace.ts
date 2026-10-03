export function compressStacktraceOutput(output: string): string {
    const lines = output.split('\n');
    if (lines.length <= 50) return output; // Small stacktraces are fine

    const result: string[] = [];
    let frameworkFrameCount = 0;
    
    // Framework signatures (node modules, python stdlib, java internal, etc)
    const isFrameworkFrame = (line: string) => {
        const lower = line.toLowerCase();
        return (
            lower.includes("node_modules/") ||
            lower.includes("node:internal/") ||
            lower.includes("site-packages/") ||
            lower.includes("lib/python") && !lower.includes("site-packages") || // python stdlib
            lower.includes("java.base/") ||
            lower.includes("sun.reflect") ||
            /^\s+at processTicksAndRejections/.test(lower)
        );
    };

    const isExceptionLine = (line: string) => {
        return (
            line.includes("Error:") ||
            line.includes("Exception:") ||
            line.includes("Caused by:") ||
            line.includes("Traceback (most recent call last):")
        );
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (isExceptionLine(line) || line.trim() === "") {
            // Flush any pending framework frames message
            if (frameworkFrameCount > 0) {
                result.push(`  ... (${frameworkFrameCount} framework/library frames collapsed) ...`);
                frameworkFrameCount = 0;
            }
            result.push(line);
            continue;
        }

        // We assume typical frame lines start with whitespace (e.g. "  at ", "    File ")
        if (/^\s+/.test(line)) {
            if (isFrameworkFrame(line)) {
                frameworkFrameCount++;
                // keep the first framework frame after application code to show boundary
                if (frameworkFrameCount <= 1) {
                     result.push(line);
                }
            } else {
                if (frameworkFrameCount > 1) { // If we kept the 1st one, and there were more
                    result.push(`  ... (${frameworkFrameCount - 1} framework/library frames collapsed) ...`);
                }
                frameworkFrameCount = 0;
                result.push(line);
            }
        } else {
            // Not a frame, likely context or message
             if (frameworkFrameCount > 0) {
                result.push(`  ... (${frameworkFrameCount} framework/library frames collapsed) ...`);
                frameworkFrameCount = 0;
            }
            result.push(line);
        }
    }

    // Flush at the end
    if (frameworkFrameCount > 1) {
        result.push(`  ... (${frameworkFrameCount - 1} framework/library frames collapsed) ...`);
    }

    return result.join('\n');
}
