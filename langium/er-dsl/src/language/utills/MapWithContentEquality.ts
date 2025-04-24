// AI-generated code. Github Co-pilot
// Based on SetWithContentEquality.ts

export class MapWithContentEquality<K, V> implements Map<K, V> {
    private readonly map: Map<string, { key: K; value: V }>;
    private readonly keyHasher: (key: K) => string;

    constructor(keyHasher: (key: K) => string = JSON.stringify) {
        this.map = new Map();
        this.keyHasher = keyHasher;
    }

    private getKeyHash(key: K): string {
        return this.keyHasher(key);
    }

    get size(): number {
        return this.map.size;
    }

    clear(): void {
        this.map.clear();
    }

    delete(key: K): boolean {
        const hash = this.getKeyHash(key);
        return this.map.delete(hash);
    }

    entries(): IterableIterator<[K, V]> {
        return Array.from(this.map.values()).map(({ key, value }): [K, V]  => [key, value])[Symbol.iterator]();
    }

    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        for (const { key, value } of this.map.values()) {
            callbackfn.call(thisArg, value, key, this);
        }
    }

    get(key: K): V | undefined {
        const hash = this.getKeyHash(key);
        return this.map.get(hash)?.value;
    }

    has(key: K): boolean {
        const hash = this.getKeyHash(key);
        return this.map.has(hash);
    }

    keys(): IterableIterator<K> {
        return Array.from(this.map.values()).map(({ key }) => key)[Symbol.iterator]();
    }

    set(key: K, value: V): this {
        const hash = this.getKeyHash(key);
        this.map.set(hash, { key, value });
        return this;
    }

    values(): IterableIterator<V> {
        return Array.from(this.map.values()).map(({ value }) => value)[Symbol.iterator]();
    }

    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.entries();
    }

    get [Symbol.toStringTag](): string {
        return 'MapWithContentEquality';
    }
}