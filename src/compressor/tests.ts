export function compressTestOutput(output: string): string {
    const lines = output.split('\n');
    if (lines.length <= 100) return output; // Small enough, don't bother

    const result: string[] = [];
    let failureMode = false;
    let consecutiveSuccesses = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // Always preserve summaries
        if (
            lowerLine.includes("test suites:") || 
            lowerLine.includes("tests:") ||
            lowerLine.includes("snapshots:") ||
            lowerLine.includes("time:") ||
            lowerLine.startsWith("ran ") && lowerLine.includes("tests in")
        ) {
            result.push(line);
            continue;
        }

        // Always preserve failures/errors
        if (
            lowerLine.includes("fail") || 
            lowerLine.includes("error") || 
            lowerLine.includes("exception") ||
            lowerLine.includes("traceback") ||
            lowerLine.includes("expected:") ||
            lowerLine.includes("received:") ||
            lowerLine.includes("at ") || // stack trace
            line.trim().startsWith(">") || // context lines
            line.trim().startsWith("E ") // pytest error
        ) {
            failureMode = true;
            consecutiveSuccesses = 0;
            result.push(line);
            continue;
        }

        // Compress consecutive passing tests or noise
        if (
            lowerLine.includes("pass") || 
            lowerLine.includes("✓") ||
            lowerLine.includes("ok")
        ) {
            if (failureMode) {
                // If we're inside a failure block, don't aggressively trim yet
                result.push(line);
            } else {
                consecutiveSuccesses++;
                if (consecutiveSuccesses <= 2) {
                    result.push(line);
                } else if (consecutiveSuccesses === 3) {
                    result.push("... (passing tests omitted)");
                }
            }
            continue;
        }

        // Generic lines
        if (line.trim() === "") {
            failureMode = false; // Empty line resets failure context block
            result.push(line);
        } else {
            result.push(line);
        }
    }

    // Secondary pass to deduplicate empty lines that might have accumulated
    const finalResult: string[] = [];
    let emptyCount = 0;
    for (const line of result) {
        if (line.trim() === "") {
            emptyCount++;
            if (emptyCount <= 2) finalResult.push(line);
        } else {
            emptyCount = 0;
            finalResult.push(line);
        }
    }

    return finalResult.join('\n');
}
