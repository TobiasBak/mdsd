import type {ValidationChecks, ValidationAcceptor} from 'langium';
import type {Attribute, Entity, GoatJhAstType, Inheritance, InheritanceType, Model} from './generated/ast.js';
import type {GoatJhServices} from './goat-jh-module.js';
import type {Range} from "vscode-languageserver";

/**
 * Register custom validation checks.
 */
export function registerThorValidation(services: GoatJhServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.ThorValidator;
    const checks: ValidationChecks<GoatJhAstType> = {
        InheritanceType: validator.singularInheritanceType,
        Model: validator.hasInheritanceType,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ThorValidator {
    parentsWithInheritanceType: Set<Entity> = new Set();

    // Check that you cannot specify inheritance type a second time.
    singularInheritanceType(inheritanceType: InheritanceType, accept: ValidationAcceptor): void {
        if (inheritanceType.entity.ref == undefined) {
            accept('error', 'The entity must be declared on the inheritanceType.', {node: inheritanceType});
            return;
        }

        if (this.parentsWithInheritanceType.has(inheritanceType.entity.ref)) {
            accept('error', 'The type of inheritance from an entity cannot be specified twice.', {
                node: inheritanceType,
                property: 'entity'
            });
        }

        this.parentsWithInheritanceType.add(inheritanceType.entity.ref);
    }

    hasInheritanceType(model: Model, accept: ValidationAcceptor): void {
        const entitiesWithSpecifiedInheritanceTypes: Set<Entity> = new Set();
        const childCounts: Map<Entity, number> = new Map();
        const inheritanceTypeForEntity: Map<Entity, InheritanceType> = new Map();
        const inheritancesFromEntity: Map<Entity, Inheritance[]> = new Map();

        model.inheritance.forEach((inheritance) => {
            const parent = inheritance.parent.ref;
            if (parent) {
                const count = childCounts.get(parent) || 0;
                childCounts.set(parent, count + inheritance.children.length);
                inheritancesFromEntity.set(parent, inheritancesFromEntity.get(parent) || []);
                inheritancesFromEntity.get(parent)?.push(inheritance);
            }
        });

        model.inheritanceType.forEach((inheritanceType) => {
            const parent = inheritanceType.entity.ref;
            if (parent) {
                entitiesWithSpecifiedInheritanceTypes.add(parent);
                inheritanceTypeForEntity.set(parent, inheritanceType);

                const count = childCounts.get(parent) || 0;
                if (count <= 0 ){
                    accept('error', 'The type of inheritance from an entity cannot be specified if the entity has no children.', {
                        node: inheritanceType,
                        // property: 'entity'
                    });
                }
            }
        })

        //Check if inheritancetype is declared for occurrences of inheritance with more than 1 child.
        for (const [parent, count] of childCounts) {
            if (count <= 1) {
                continue;
            }
            if (!entitiesWithSpecifiedInheritanceTypes.has(parent)) {
                const inheritances = inheritancesFromEntity.get(parent);
                const warningMessage = `The type of inheritance from an entity must be specified if the entity has more than one child.\n` +
                    `Consider adding a new line: Inheritance from ${parent.name} is disjoint.`;
                if (inheritances == undefined) {
                    accept('warning', warningMessage, {node: parent});
                    continue;
                }
                inheritances.forEach((inheritance) => {
                  accept("warning", warningMessage, {node: inheritance});
                })
            }
        }

        //Check that parents with only one child does not have inheritance type specified.
        for (const [parent, count] of childCounts) {
            if (!entitiesWithSpecifiedInheritanceTypes.has(parent)) {
                continue;
            }
            if (count > 1) {
                continue;
            }
            const inheritanceType = inheritanceTypeForEntity.get(parent);
            if (inheritanceType == undefined) {
                continue;
            }
            accept(
                'warning',
                'The type of inheritance from an entity must not be specified if the entity has only one child.\n',
                {node: inheritanceType}
            );
        }

    }
}
        
