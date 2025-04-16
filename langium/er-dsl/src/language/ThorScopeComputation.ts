import {DefaultScopeComputation} from "langium";

import type { AstNode } from 'langium';
import type { LangiumDocument, PrecomputedScopes } from 'langium';
import {isAttribute, isEntity, isModel} from "./generated/ast.js";

export class ThorScopeComputation extends DefaultScopeComputation {
    private children: Map<AstNode, AstNode[]> = new Map();
    private lastProcessedDocumentVersion: number = -1;



    /**
     * Process a single node during scopes computation. The default implementation makes the node visible
     * in the subtree of its container (if the node has a name). Override this method to change this,
     * e.g. by increasing the visibility to a higher level in the AST.
     */
    protected processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const currentVersion = document.textDocument._version;
        if (currentVersion !== this.lastProcessedDocumentVersion){
            this.lastProcessedDocumentVersion = currentVersion;
            this.processInheritance(document);
            console.error("process inheritance")
        }

        const container = node.$container;
        if (!container) {
            return
        }
        const name = this.nameProvider.getName(node);
        if (!name) {
            return;
        }

        scopes.add(container, this.descriptions.createDescription(node, name, document));

        if(!isAttribute(node)) {
            return;
        }
        if(!isEntity(container)) {
            return;
        }

        const children = this.children.get(container);
        if (!children) {
            return;
        }
        for (const child of children) {
            scopes.add(child, this.descriptions.createDescription(node, name, document));
            // TODO: Expand this to add the children of the children as well.
            // Consider circular inheritance? how do we avoid dying in a loop?
            // Perhaps extracting the functionality from the circular validator could help to stop early.
            // It is necessary because this runs before validation. As such validation cant throw error before this runs.
        }
    }

    private processInheritance(document: LangiumDocument) {
        const model = document.parseResult.value;
        if (!model) {
            return;
        }
        if (isModel(model)) {
            const inheritances = model.inheritance;
            for (const inheritance of inheritances) {
                const parent = inheritance.parent.ref;
                if (!parent) {
                    continue;
                }
                const children = inheritance.children;
                for (const child of children) {
                    const childRef = child.ref;
                    if (isEntity(childRef)) {
                        if (!this.children.has(parent)) {
                            this.children.set(parent, []);
                        }
                        this.children.get(parent)?.push(childRef)
                    }
                }
            }
        }
    }
}
