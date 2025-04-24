// Code from:
//https://howtodoinjava.com/typescript/sets/
// But modified to use Map, because it used Array and some for filtering. (linear time improved to constant time)

export class SetWithContentEquality<T> {
    private betterItems: Map<string, T>;
    private getKey: (item: T) => string;
    private itemSet: Set<T>;

    constructor(getKey: (item: T) => string) {
        this.getKey = getKey;
        this.betterItems = new Map();
        this.itemSet = new Set();
    }

    add(item: T): void {
        const key = this.getKey(item);
        const existingItem = this.betterItems.get(key);
        if (existingItem === undefined) {
            this.betterItems.set(key, item);
            this.itemSet.add(item);
        }
    }

    has(item: T): boolean {
        return this.betterItems.has(this.getKey(item));
    }

    values(): T[] {
        return [...this.betterItems.values()];
    }

    asSet(): Set<T> {
        return this.itemSet;
    }
}