const fs = require('fs');

async function main() {
    let inputData = '';
    
    // Read from stdin
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
        inputData += chunk;
    }

    try {
        const payload = JSON.parse(inputData);
        const eventName = payload.event;
        const toolName = payload.toolName;
        const isProbeA = process.env.PROBE_TYPE === 'A';
        const isProbeB = process.env.PROBE_TYPE === 'B';
        const isProbeC = process.env.PROBE_TYPE === 'C';

        if (isProbeA) {
            console.error('TOKEN_OPTIMIZER_EXIT2_PROBE');
            process.exit(2);
        } else if (isProbeB) {
            console.log(JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: eventName || "AfterTool", // Using AfterTool based on discovery
                    additionalContext: "TOKEN_OPTIMIZER_JSON_PROBE"
                }
            }));
            process.exit(0);
        } else if (isProbeC) {
            console.log(JSON.stringify({
                decision: "block",
                reason: "TOKEN_OPTIMIZER_BLOCK_PROBE"
            }));
            process.exit(0);
        } else {
             console.log(JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: eventName || "AfterTool",
                    additionalContext: "PROBE_SUCCESSFUL"
                }
            }));
            process.exit(0);
        }

    } catch (err) {
        console.error("Error parsing stdin:", err.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
