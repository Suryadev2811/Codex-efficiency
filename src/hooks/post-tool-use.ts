import { getConfig } from "../config/config";
import { compress } from "../compressor/compressor";
import { globalAnalyticsStore } from "../analytics/store";
import { redactSecrets } from "../security/secrets";

async function main() {
    let inputData = '';
    
    // 1. Safe Stdin Parse
    process.stdin.setEncoding('utf8');
    try {
        for await (const chunk of process.stdin) {
            inputData += chunk;
        }
    } catch (e) {
        process.stderr.write(`[TokenOptimizer] Error reading stdin: ${(e as Error).message}\n`);
        process.exit(0); // Fail open
    }

    if (!inputData.trim()) {
        process.exit(0);
    }

    let payload: any;
    try {
        payload = JSON.parse(inputData);
    } catch (e) {
        process.stderr.write(`[TokenOptimizer] Invalid JSON in stdin\n`);
        process.exit(0); // Fail open
    }

    const config = getConfig();
    if (!config.enabled) {
        process.exit(0);
    }

    // 2. Extract Data (Codex Hook Schema)
    const eventName = payload.event || "AfterTool";
    const toolName = payload.toolName;
    const hookInput = payload.hookInput;
    
    let rawOutput = "";

    // The result from the tool is often passed in `hookInput.result.llmContent`
    if (hookInput && hookInput.result) {
        const llmContent = hookInput.result.llmContent;
        if (typeof llmContent === 'string') {
            rawOutput = llmContent;
        } else if (Array.isArray(llmContent)) {
            // Might be an array of text parts
            rawOutput = llmContent.map((part: any) => typeof part === 'string' ? part : part.text || "").join("\n");
        } else if (llmContent && typeof llmContent === 'object') {
             rawOutput = llmContent.text || "";
        }
    } else if (payload.output) {
        // Fallback for some structures
        rawOutput = payload.output;
    }

    if (!rawOutput) {
        process.exit(0);
    }

    // 3. Compress
    try {
        const result = await compress({
            output: rawOutput,
            toolName: toolName,
            maxPassthroughTokens: config.maxPassthroughTokens,
            timeoutMs: config.timeoutMs
        });

        if (config.analyticsEnabled && result.category !== "passthrough") {
            globalAnalyticsStore.recordCompression({
                tool: toolName || "unknown",
                category: result.category,
                originalTokens: result.originalTokens,
                compressedTokens: result.compressedTokens,
                savedTokens: result.savedTokens,
                reductionPercent: result.reductionPercent,
                latencyMs: result.latencyMs
            });
        }

        if (result.changed) {
            const redacted = redactSecrets(result.compressed);
            
            const hookSpecificOutput = {
                hookEventName: eventName,
                additionalContext: `\n--- OPTIMIZED CONTEXT (${result.category}) ---\n${redacted}\n--- END OPTIMIZED CONTEXT ---\n`
            };

            process.stdout.write(JSON.stringify({ hookSpecificOutput }) + "\n");
        } else {
            // Unchanged, just exit cleanly.
            process.exit(0);
        }

    } catch (e) {
        process.stderr.write(`[TokenOptimizer] Compression failed: ${(e as Error).message}\n`);
        process.exit(0); // Fail open
    }
}

main().catch(err => {
    process.stderr.write(`[TokenOptimizer] Unhandled error: ${err.message}\n`);
    process.exit(0);
});
