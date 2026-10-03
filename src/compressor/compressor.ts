import { classifyOutput } from "./classifier";
import { compressGitOutput } from "./git";
import { compressTestOutput } from "./tests";
import { compressBuildOutput } from "./build";
import { compressStacktraceOutput } from "./stacktrace";
import { compressGenericOutput } from "./generic";

export interface CompressionInput {
    output: string;
    toolName?: string;
    maxPassthroughTokens: number;
    timeoutMs: number;
}

export interface CompressionResult {
    original: string;
    compressed: string;
    originalTokens: number;
    compressedTokens: number;
    savedTokens: number;
    reductionPercent: number;
    category: string;
    changed: boolean;
    latencyMs: number;
}

// Simple heuristic token estimator
export function estimateTokens(text: string): number {
    return Math.max(1, Math.round(text.length / 4));
}

// Ensure critical terms from the original survive into the compressed output
function validateCriticalInfoPreserved(original: string, compressed: string): boolean {
    const criticalPatterns = [
        /error\b/i,
        /fatal\b/i,
        /exception\b/i,
        /traceback/i,
        /assertionerror/i,
        /typeerror/i,
        /referenceerror/i,
        /syntaxerror/i,
        /fail\b/i,
        /failed\b/i
    ];

    const originalLower = original.toLowerCase();
    const compressedLower = compressed.toLowerCase();

    for (const pattern of criticalPatterns) {
        if (pattern.test(originalLower) && !pattern.test(compressedLower)) {
            // A critical pattern was completely destroyed
            return false;
        }
    }
    return true;
}

export async function compress(input: CompressionInput): Promise<CompressionResult> {
    const startTime = performance.now();
    
    const originalTokens = estimateTokens(input.output);

    // 1. Fast Path
    if (originalTokens <= input.maxPassthroughTokens) {
        const latency = performance.now() - startTime;
        return {
            original: input.output,
            compressed: input.output,
            originalTokens,
            compressedTokens: originalTokens,
            savedTokens: 0,
            reductionPercent: 0,
            category: "passthrough",
            changed: false,
            latencyMs: latency
        };
    }

    // 2. Classify
    const category = classifyOutput(input.output, input.toolName);

    // 3. Compress with timeout
    let compressedOutput = input.output;
    let timeoutId: NodeJS.Timeout | undefined;
    try {
        const timeoutPromise = new Promise<string>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error("Compression timeout")), input.timeoutMs);
        });

        const compressPromise = new Promise<string>((resolve) => {
            switch (category) {
                case "git":
                    resolve(compressGitOutput(input.output));
                    break;
                case "test":
                    resolve(compressTestOutput(input.output));
                    break;
                case "build":
                case "package-manager":
                    resolve(compressBuildOutput(input.output));
                    break;
                case "stacktrace":
                    resolve(compressStacktraceOutput(input.output));
                    break;
                case "generic":
                case "search":
                case "unknown":
                default:
                    resolve(compressGenericOutput(input.output));
                    break;
            }
        });

        compressedOutput = await Promise.race([compressPromise, timeoutPromise]);
    } catch (e) {
        // Fallback on timeout or error
        compressedOutput = input.output;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }

    // 4. Validate
    if (compressedOutput !== input.output) {
        if (!validateCriticalInfoPreserved(input.output, compressedOutput)) {
            compressedOutput = input.output; // Revert if unsafe
        }
    }

    // 5. Final check: is it actually better?
    let finalCompressed = compressedOutput;
    let compressedTokens = estimateTokens(finalCompressed);
    
    // Only keep if we saved at least 10%
    if (compressedTokens > originalTokens * 0.9) {
        finalCompressed = input.output;
        compressedTokens = originalTokens;
    }

    const changed = finalCompressed !== input.output;
    const savedTokens = originalTokens - compressedTokens;
    const reductionPercent = originalTokens > 0 ? (savedTokens / originalTokens) * 100 : 0;
    const latency = performance.now() - startTime;

    return {
        original: input.output,
        compressed: finalCompressed,
        originalTokens,
        compressedTokens,
        savedTokens,
        reductionPercent: Number(reductionPercent.toFixed(2)),
        category,
        changed,
        latencyMs: Number(latency.toFixed(2))
    };
}
