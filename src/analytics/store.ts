// This file manages the local, non-persistent metrics for the token optimizer

export interface CompressionEvent {
    timestamp: number;
    tool: string;
    category: string;
    originalTokens: number;
    compressedTokens: number;
    savedTokens: number;
    reductionPercent: number;
    latencyMs: number;
}

class AnalyticsStore {
    private events: CompressionEvent[] = [];
    private _astCacheHits = 0;
    private _astCacheMisses = 0;

    public recordCompression(event: Omit<CompressionEvent, 'timestamp'>): void {
        this.events.push({
            ...event,
            timestamp: Date.now()
        });
    }

    public recordAstHit(): void {
        this._astCacheHits++;
    }

    public recordAstMiss(): void {
        this._astCacheMisses++;
    }

    public getSavingsReport() {
        const totalOriginalTokens = this.events.reduce((sum, e) => sum + e.originalTokens, 0);
        const totalCompressedTokens = this.events.reduce((sum, e) => sum + e.compressedTokens, 0);
        const totalSavedTokens = totalOriginalTokens - totalCompressedTokens;
        
        let overallReductionPercent = 0;
        if (totalOriginalTokens > 0) {
            overallReductionPercent = (totalSavedTokens / totalOriginalTokens) * 100;
        }

        const validLatencies = this.events.filter(e => e.category !== 'passthrough').map(e => e.latencyMs);
        const averageCompressionLatency = validLatencies.length > 0 
            ? validLatencies.reduce((sum, l) => sum + l, 0) / validLatencies.length 
            : 0;

        const compressionCount = this.events.filter(e => e.category !== 'passthrough' && e.savedTokens > 0).length;
        const passthroughCount = this.events.filter(e => e.category === 'passthrough').length;

        let astCacheHitRate = 0;
        const totalAstCalls = this._astCacheHits + this._astCacheMisses;
        if (totalAstCalls > 0) {
            astCacheHitRate = this._astCacheHits / totalAstCalls;
        }

        return {
            totalOriginalTokens,
            totalCompressedTokens,
            totalSavedTokens,
            overallReductionPercent: Number(overallReductionPercent.toFixed(2)),
            averageCompressionLatency: Number(averageCompressionLatency.toFixed(2)),
            compressionCount,
            passthroughCount,
            astCacheHitRate: Number(astCacheHitRate.toFixed(4))
        };
    }
}

export const globalAnalyticsStore = new AnalyticsStore();
