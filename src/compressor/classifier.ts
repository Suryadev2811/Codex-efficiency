export type OutputCategory = 
    | "git"
    | "test"
    | "build"
    | "stacktrace"
    | "grep"
    | "search"
    | "package-manager"
    | "generic"
    | "unknown";

export function classifyOutput(output: string, toolName?: string): OutputCategory {
    // 1. Tool name hints
    if (toolName) {
        const tn = toolName.toLowerCase();
        if (tn === "run_shell_command" || tn === "shelltool") {
            // Need to look at output
        } else if (tn.includes("grep") || tn.includes("search")) {
            return "search";
        } else if (tn.includes("git")) {
            return "git";
        }
    }

    // Fast path: Check first few lines for obvious markers
    const lines = output.split('\n', 10);
    const head = lines.join('\n').toLowerCase();

    // 2. Git
    if (head.startsWith("diff --git") || head.includes("git status") || head.includes("commit ") || head.startsWith("on branch")) {
        return "git";
    }

    // 3. Tests
    if (
        head.includes("test suite") || 
        head.includes("tests passed") || 
        head.includes("tests failed") ||
        head.includes("jest") ||
        head.includes("pytest") ||
        head.includes("running tests") ||
        head.includes("fail ") && head.includes(".test.")
    ) {
        return "test";
    }

    // 4. Stacktraces
    if (head.includes("traceback (most recent call last)") || head.includes("error: ") && head.includes("\n    at ")) {
        return "stacktrace";
    }

    // 5. Build/Compiler
    if (
        head.includes("compiling") || 
        head.includes("tsc ") || 
        head.includes("webpack") ||
        head.includes("vite v") ||
        head.includes("cargo build")
    ) {
        return "build";
    }

    // 6. Package Manager
    if (
        head.includes("npm install") || 
        head.includes("yarn install") || 
        head.includes("pnpm install") ||
        head.includes("pip install") ||
        head.includes("added ") && head.includes("packages")
    ) {
        return "package-manager";
    }

    // 7. Search/Grep output (files with lines and colon, typically)
    const matchLineRegex = /^.+:\d+:/m;
    if (matchLineRegex.test(head)) {
        return "search";
    }

    if (output.trim() === "") {
        return "unknown";
    }

    return "generic";
}
