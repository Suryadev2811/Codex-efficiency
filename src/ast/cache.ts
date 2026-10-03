import * as crypto from 'crypto';

interface CacheEntry {
    outline: string;
    originalLength: number;
    outlineLength: number;
    lastAccessed: number;
}

export class AstCache {
    private cache: Map<string, CacheEntry> = new Map();
    private maxSize: number;

    private hits = 0;
    private misses = 0;
    private evictions = 0;

    constructor(maxSize: number = 128) {
        this.maxSize = maxSize;
    }

    private generateKey(filePath: string, language: string, source: string, focusedSymbols: string[]): string {
        const hash = crypto.createHash('sha256');
        hash.update(filePath);
        hash.update(language);
        hash.update(source);
        hash.update(focusedSymbols.join(','));
        return hash.digest('hex');
    }

    public get(filePath: string, language: string, source: string, focusedSymbols: string[]): CacheEntry | undefined {
        const key = this.generateKey(filePath, language, source, focusedSymbols);
        const entry = this.cache.get(key);

        if (entry) {
            entry.lastAccessed = Date.now();
            this.hits++;
            return entry;
        }

        this.misses++;
        return undefined;
    }

    public set(filePath: string, language: string, source: string, focusedSymbols: string[], outline: string, originalLength: number, outlineLength: number): void {
        if (this.cache.size >= this.maxSize) {
            this.evict();
        }

        const key = this.generateKey(filePath, language, source, focusedSymbols);
        this.cache.set(key, {
            outline,
            originalLength,
            outlineLength,
            lastAccessed: Date.now()
        });
    }

    private evict(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.evictions++;
        }
    }

    public getStats() {
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            evictions: this.evictions,
            hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) : 0
        };
    }
}
