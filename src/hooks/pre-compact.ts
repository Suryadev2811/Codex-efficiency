import { globalAnalyticsStore } from "../analytics/store";
import { getConfig } from "../config/config";

async function main() {
    let inputData = '';
    
    process.stdin.setEncoding('utf8');
    try {
        for await (const chunk of process.stdin) {
            inputData += chunk;
        }
    } catch (e) {
        process.stderr.write(`[TokenOptimizer:PreCompress] Error reading stdin: ${(e as Error).message}\n`);
        process.exit(0);
    }

    if (!inputData.trim()) {
        process.exit(0);
    }

    const config = getConfig();
    if (!config.enabled || !config.analyticsEnabled) {
        process.exit(0);
    }

    try {
        const payload = JSON.parse(inputData);
        // We just log that compaction is happening and maybe output the savings so far.
        // We do NOT block compaction.
        
        const report = globalAnalyticsStore.getSavingsReport();
        
        if (report.compressionCount > 0) {
            process.stderr.write(`[TokenOptimizer:PreCompress] Triggered. Session savings: ${report.totalSavedTokens} tokens (${report.overallReductionPercent}% reduction across ${report.compressionCount} optimizations).\n`);
        }

        // Return empty output, meaning "proceed normally"
        process.exit(0);

    } catch (e) {
        process.stderr.write(`[TokenOptimizer:PreCompress] Failed: ${(e as Error).message}\n`);
        process.exit(0);
    }
}

main().catch(err => {
    process.stderr.write(`[TokenOptimizer:PreCompress] Unhandled error: ${err.message}\n`);
    process.exit(0);
});
