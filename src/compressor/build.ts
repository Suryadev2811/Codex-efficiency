export function compressBuildOutput(output: string): string {
    const lines = output.split('\n');
    if (lines.length <= 100) return output; // Small enough, don't bother

    const result: string[] = [];
    let consecutiveNoise = 0;
    
    // Build systems can be extremely noisy. Keep errors, warnings, and their immediate context.
    let inContextBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // Check for critical information
        const isCritical = 
            lowerLine.includes("error") || 
            lowerLine.includes("fatal") || 
            lowerLine.includes("warning") ||
            lowerLine.includes("exception") ||
            lowerLine.includes("failed") ||
            /^\s*at\s+/.test(lowerLine) || // stack traces
            /^[\w\/\.\-]+\:\d+\:\d+/.test(lowerLine); // file:line:col paths (tsc, gcc, etc)

        if (isCritical) {
            inContextBlock = true;
            consecutiveNoise = 0;
            result.push(line);
            continue;
        }

        // Noise patterns (progress bars, downloading packages, building modules)
        const isNoise = 
            lowerLine.startsWith("[") && lowerLine.includes("]") && lowerLine.includes("/") || // [1/100] Building...
            lowerLine.includes("downloading") || 
            lowerLine.includes("fetching") || 
            lowerLine.startsWith("info ") ||
            /^\s*[\d\.]+%/.test(lowerLine); // 99% done

        if (isNoise && !inContextBlock) {
            consecutiveNoise++;
            if (consecutiveNoise === 1) {
                result.push("... (build progress omitted)");
            }
            continue;
        }

        // Context boundary reset (empty lines often signify end of an error block)
        if (line.trim() === "") {
            inContextBlock = false;
        }

        // Default: keep it if we are in a context block or haven't hit noise
        result.push(line);
        consecutiveNoise = 0;
    }

    return result.join('\n');
}
