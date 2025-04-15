import {AstNode, DONE_RESULT, GenericAstNode, isAstNode, Stream, StreamImpl, TreeStream, TreeStreamImpl} from "langium";
import type {Range} from "vscode-languageserver-types";

export interface AstStreamOptions {
    /**
     * Optional target range that the nodes in the stream need to intersect
     */
    range?: Range
}


/**
 * Create a stream of all AST nodes that are directly contained in the given node. This includes
 * single-valued as well as multi-valued (array) properties.
 */
export function streamContents(node: AstNode, options?: AstStreamOptions): Stream<AstNode> {
    if (!node) {
        throw new Error('Node must be an AstNode.');
    }
    const range = options?.range;
    type State = { keys: string[], keyIndex: number, arrayIndex: number };
    return new StreamImpl<State, AstNode>(() => ({
        keys: Object.keys(node),
        keyIndex: 0,
        arrayIndex: 0
    }), state => {
        while (state.keyIndex < state.keys.length) {
            const property = state.keys[state.keyIndex];
            if (!property.startsWith('$')) {
                const value = (node as GenericAstNode)[property];
                if (isAstNode(value)) {
                    state.keyIndex++;
                    if (isAstNodeInRange(value, range)) {
                        return { done: false, value };
                    }
                } else if (Array.isArray(value)) {
                    while (state.arrayIndex < value.length) {
                        const index = state.arrayIndex++;
                        const element = value[index];
                        if (isAstNode(element) && isAstNodeInRange(element, range)) {
                            return { done: false, value: element };
                        }
                    }
                    state.arrayIndex = 0;
                }
            }
            state.keyIndex++;
        }
        return DONE_RESULT;
    });
}

/**
 * Create a stream of all AST nodes that are directly and indirectly contained in the given root node.
 * This does not include the root node itself.
 */
export function streamAllContents(root: AstNode, options?: AstStreamOptions): TreeStream<AstNode> {
    if (!root) {
        throw new Error('Root node must be an AstNode.');
    }
    return new TreeStreamImpl(root, node => streamContents(node, options));
}

function isAstNodeInRange(astNode: AstNode, range?: Range): boolean {
    if (!range) {
        return true;
    }
    const nodeRange = astNode.$cstNode?.range;
    if (!nodeRange) {
        return false;
    }
    return inRange(nodeRange, range);
}

export function compareRange(range: Range, to: Range): RangeComparison {
    if (range.end.line < to.start.line || (range.end.line === to.start.line && range.end.character <= to.start.character)) {
        return RangeComparison.Before;
    } else if (range.start.line > to.end.line || (range.start.line === to.end.line && range.start.character >= to.end.character)) {
        return RangeComparison.After;
    }
    const startInside = range.start.line > to.start.line || (range.start.line === to.start.line && range.start.character >= to.start.character);
    const endInside = range.end.line < to.end.line || (range.end.line === to.end.line && range.end.character <= to.end.character);
    if (startInside && endInside) {
        return RangeComparison.Inside;
    } else if (startInside) {
        return RangeComparison.OverlapBack;
    } else if (endInside) {
        return RangeComparison.OverlapFront;
    } else {
        return RangeComparison.Outside;
    }
}

export function inRange(range: Range, to: Range): boolean {
    const comparison = compareRange(range, to);
    return comparison > RangeComparison.After;
}

export enum RangeComparison {
    Before = 0,
    After = 1,
    OverlapFront = 2,
    OverlapBack = 3,
    Inside = 4,
    Outside = 5,
}