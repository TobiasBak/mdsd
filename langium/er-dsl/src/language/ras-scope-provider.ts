import { DefaultScopeProvider, ReferenceInfo, Scope } from 'langium';
import { Entity } from './generated/ast.js';

export class RasScopeProvider extends DefaultScopeProvider {
    override getScope(context: ReferenceInfo): Scope {
        if (context.property === 'attribute' && context.container.$type === 'RequiresStatement') {
            // Use 'any' or a type guard if you want to be more strict
            const requiresStmt = context.container as any;
            const entity = requiresStmt.entity?.ref as Entity | undefined;
            if (entity) {
                const attributeDescriptions = (entity.attributes ?? []).map(attr => this.descriptions.createDescription(attr, attr.name));
                return this.createScope(attributeDescriptions);
            }
        }
        return super.getScope(context);
    }
}