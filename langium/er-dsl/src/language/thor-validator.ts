import type {ValidationChecks, ValidationAcceptor, DiagnosticInfo} from 'langium';
import type {Attribute, Entity, GoatJhAstType, Inheritance, InheritanceType, Model} from './generated/ast.js';
import type {GoatJhServices} from './goat-jh-module.js';
import {SetWithContentEquality} from "./utills/SetWithContentEquality.js";
import {MapWithContentEquality} from "./utills/MapWithContentEquality.js";


/**
 * Register custom validation checks.
 */
export function registerThorValidation(services: GoatJhServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.ThorValidator;
    const checks: ValidationChecks<GoatJhAstType> = {
        InheritanceType: validator.singularInheritanceType,
        Model: validator.hasInheritanceType,
        Entity: validator.noDuplicateAttributes,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ThorValidator {
    parentsWithInheritanceType: Set<Entity> = new Set();
    entitiesParticipatingInCircularInheritance: SetWithContentEquality<Entity> = new SetWithContentEquality((entity: Entity) => entity.name);
    /**
     * Key: Child Entity
     *
     * Value: Parent Entity
     */
    parents: Map<Entity, Entity> = new MapWithContentEquality((entity: Entity) => entity.name);

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

                inheritance.children.forEach((child) => {
                    if (child.ref) {
                        this.parents.set(child.ref, parent);
                    }
                });
            }
        });

        this.inheritanceTypeOnlyAllowedWithChildren(model, entitiesWithSpecifiedInheritanceTypes, inheritanceTypeForEntity, childCounts, accept);

        //Check if inheritanceType is declared for occurrences of inheritance with more than 1 child.
        this.checkInheritanceTypeIsSpecified(childCounts, entitiesWithSpecifiedInheritanceTypes, inheritancesFromEntity, accept);

        //Check that parents with only one child does not have inheritance type specified.
        this.singleChildrenNoInheritanceType(childCounts, entitiesWithSpecifiedInheritanceTypes, inheritanceTypeForEntity, accept);

        this.uniqueEntityNames(model, accept);

        this.noCircularInheritance(inheritancesFromEntity, accept);
    }


    private noCircularInheritance(inheritancesFromEntity: Map<Entity, Inheritance[]>, accept: ValidationAcceptor) {
        console.warn("Checking for circular inheritance")
        const checkedEntitiesForCircularInheritance: Set<Entity> = new Set();

        this.parents.forEach((parent, child) => {
            let current: Entity | undefined = parent;

            const loopStorage: Array<Entity> = [];
            const localVisits: Set<Entity> = new Set();

            while (current) {
                if (localVisits.has(current)) {
                    // Circular inheritance detected
                    const startingIndex = loopStorage.indexOf(current);
                    const diagnostics: DiagnosticInfo<Inheritance>[] = []
                    const loopEntityNames: string[] = []

                    for (let i = startingIndex; i < loopStorage.length; i++) {
                        const localChild = loopStorage[i];
                        const parentIndex = i + 1 < loopStorage.length ? i + 1 : startingIndex;
                        const localParent = loopStorage[parentIndex];

                        diagnostics.push(...this.errorOnInheritance(inheritancesFromEntity, localParent, localChild, accept));
                        loopEntityNames.push(localChild.name)
                    }

                    loopEntityNames.push(loopEntityNames[0])
                    const loopString = loopEntityNames.join(" -> ")
                    for (const diagnostic of diagnostics) {
                        accept("error", 'Circular inheritance detected: ' + loopString, diagnostic)
                    }

                    return;
                }

                loopStorage.push(current);

                if (checkedEntitiesForCircularInheritance.has(current)) { // Skip for optimization
                    break;
                }
                localVisits.add(current)
                checkedEntitiesForCircularInheritance.add(current)

                current = this.parents.get(current);
            }

        })
    }

    private errorOnInheritance(inheritancesFromEntity: Map<Entity, Inheritance[]>, parent: Entity, child: Entity, accept: ValidationAcceptor) {
        const temp = this.getInheritanceBetweenEntities(inheritancesFromEntity, parent, child);
        const inheritanceWithRightChild = temp.inheritance
        const childIndex = temp.childIndex

        if (inheritanceWithRightChild == undefined) {
            console.error("Could not find inheritance between entities")
            return []
        }

        this.entitiesParticipatingInCircularInheritance.add(parent);
        this.entitiesParticipatingInCircularInheritance.add(child);

        const parentDiagnostic: DiagnosticInfo<Inheritance> = {
            node: inheritanceWithRightChild,
            property: "parent",
        }

        const childDiagnostic: DiagnosticInfo<Inheritance> = {
            node: inheritanceWithRightChild,
            property: "children",
            index: childIndex
        }

        return [parentDiagnostic, childDiagnostic]
    }

    private getInheritanceBetweenEntities(inheritancesFromEntity: Map<Entity, Inheritance[]>, parent: Entity, child: Entity): {inheritance: Inheritance, childIndex: number} {
        const inheritancesFromThisParent = inheritancesFromEntity.get(parent);

        if (inheritancesFromThisParent == undefined) {
            console.error("Could not find inheritance from this entity", inheritancesFromEntity, parent, child)
            throw new Error("Could not find inheritance from " + parent.name)
        }

        const inheritanceWithRightChild = inheritancesFromEntity.get(parent)?.find((inheritance) => {
            return inheritance.children.some((inheritanceChild) => {
                return inheritanceChild.ref?.name == child.name;
            })
        })

        if (inheritanceWithRightChild == undefined) {
            console.error("Could not find inheritance between entities", inheritancesFromEntity, parent, child)
            throw new Error("Could not find inheritance between entities")
        }

        const childIndex = inheritanceWithRightChild.children.findIndex((childLoop) => childLoop.ref === child);
        return {inheritance: inheritanceWithRightChild, childIndex: childIndex};
    }

    private inheritanceTypeOnlyAllowedWithChildren(model: Model, entitiesWithSpecifiedInheritanceTypes: Set<Entity>, inheritanceTypeForEntity: Map<Entity, InheritanceType>, childCounts: Map<Entity, number>, accept: ValidationAcceptor) {
        model.inheritanceType.forEach((inheritanceType) => {
            const parent = inheritanceType.entity.ref;
            if (parent) {
                entitiesWithSpecifiedInheritanceTypes.add(parent);
                inheritanceTypeForEntity.set(parent, inheritanceType);

                const count = childCounts.get(parent) || 0;
                if (count <= 0) {
                    accept('warning', 'The type of inheritance from an entity cannot be specified if the entity has no children.', {
                        node: inheritanceType,
                        // property: 'entity'
                    });
                }
            }
        })
    }

    private singleChildrenNoInheritanceType(childCounts: Map<Entity, number>, entitiesWithSpecifiedInheritanceTypes: Set<Entity>, inheritanceTypeForEntity: Map<Entity, InheritanceType>, accept: ValidationAcceptor) {
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

    private checkInheritanceTypeIsSpecified(childCounts: Map<Entity, number>, entitiesWithSpecifiedInheritanceTypes: Set<Entity>, inheritancesFromEntity: Map<Entity, Inheritance[]>, accept: ValidationAcceptor) {
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
    }

    uniqueEntityNames(model: Model, accept: ValidationAcceptor): void {
        const entityNames = new Set<string>();

        model.entities.forEach((entity) => {
            const name = entity.name;
            if (entityNames.has(name)) {
                accept('error', `Another entity is already defined with this name`, {node: entity, property: 'name'});
            } else {
                entityNames.add(name);
            }
        });
    }

    noDuplicateAttributes(entity: Entity, accept: ValidationAcceptor): void {
        const attributesSeen = new Set<string>();

        console.log("Checking for duplicate attributes", this.entitiesParticipatingInCircularInheritance.asSet())

        entity.attributes.forEach((attribute) => {
            const attributeName = attribute.name;
            if (attributesSeen.has(attributeName)) {
                accept('warning', 'Duplicate attribute name.', {node: attribute, property: 'name'});
            }

            let parentEntity: Entity | undefined = this.parents.get(entity);
            while (parentEntity && !this.entitiesParticipatingInCircularInheritance.asSet().has(parentEntity)) {
                parentEntity?.attributes.forEach((parentAttribute) => {
                    if (parentAttribute.name == attributeName) {
                        accept('warning', `Duplicate attribute name. Conflicts with parent: ${parentEntity?.name}`, {node: attribute, property: 'name'});
                    }
                })
                parentEntity = this.parents.get(parentEntity);
            }

            attributesSeen.add(attributeName);
        });
        //console.log(entity)
    }
}
        
