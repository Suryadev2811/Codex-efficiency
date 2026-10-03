export interface OptimizerConfig {
    enabled: boolean;
    maxPassthroughTokens: number;
    timeoutMs: number;
    astCacheSize: number;
    analyticsEnabled: boolean;
}

export function getConfig(): OptimizerConfig {
    return {
        enabled: parseBooleanEnv("TOKEN_OPTIMIZER_ENABLED", true),
        maxPassthroughTokens: parseIntegerEnv("TOKEN_OPTIMIZER_MAX_PASSTHROUGH_TOKENS", 1500),
        timeoutMs: parseIntegerEnv("TOKEN_OPTIMIZER_TIMEOUT_MS", 800),
        astCacheSize: parseIntegerEnv("TOKEN_OPTIMIZER_AST_CACHE_SIZE", 128),
        analyticsEnabled: parseBooleanEnv("TOKEN_OPTIMIZER_ANALYTICS_ENABLED", true),
    };
}

function parseBooleanEnv(key: string, defaultValue: boolean): boolean {
    const val = process.env[key];
    if (val === undefined) {
        return defaultValue;
    }
    return val.toLowerCase() === "true" || val === "1";
}

function parseIntegerEnv(key: string, defaultValue: number): number {
    const val = process.env[key];
    if (val === undefined) {
        return defaultValue;
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}
