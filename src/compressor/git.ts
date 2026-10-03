export function compressGitOutput(output: string): string {
    const lines = output.split('\n');
    if (lines.length === 0) return output;

    // Detect if this is a diff
    if (output.startsWith("diff --git") || output.includes("\ndiff --git")) {
        return compressGitDiff(lines);
    }
    
    // Status and others - just generic compression for now if it's too long
    // Most git status outputs are small anyway
    if (lines.length <= 100) {
        return output;
    }

    return compressGenericGit(lines);
}

function compressGitDiff(lines: string[]): string {
    const result: string[] = [];
    let inHunk = false;
    let unchangedCount = 0;
    const MAX_UNCHANGED_LINES = 3;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("diff --git")) {
            result.push(""); // Spacing
            result.push(line);
            inHunk = false;
            unchangedCount = 0;
            continue;
        }

        if (line.startsWith("index ") || line.startsWith("--- ") || line.startsWith("+++ ")) {
            result.push(line);
            continue;
        }

        if (line.startsWith("@@ ")) {
            result.push(line);
            inHunk = true;
            unchangedCount = 0;
            continue;
        }

        if (inHunk) {
            const isAdded = line.startsWith("+");
            const isRemoved = line.startsWith("-");

            if (isAdded || isRemoved) {
                // Always keep changes
                result.push(line);
                unchangedCount = 0;
            } else {
                // Keep limited context
                if (unchangedCount < MAX_UNCHANGED_LINES) {
                    result.push(line);
                } else if (unchangedCount === MAX_UNCHANGED_LINES) {
                    result.push(" ... (unchanged lines omitted)");
                }
                unchangedCount++;
            }
        } else {
            result.push(line);
        }
    }

    return result.join('\n').trim();
}

function compressGenericGit(lines: string[]): string {
    // Basic deduplication and length capping
    const maxLines = 200;
    if (lines.length <= maxLines) return lines.join('\n');

    const top = lines.slice(0, 100);
    const bottom = lines.slice(lines.length - 100);

    return [...top, `\n... (${lines.length - 200} lines omitted) ...\n`, ...bottom].join('\n');
}
