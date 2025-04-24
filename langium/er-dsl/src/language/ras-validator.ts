import { GoatJhServices } from "./goat-jh-module.js";
import { ValidationAcceptor, ValidationChecks } from "langium";
import { Model, Entity, Inheritance } from "./generated/ast.js";
import { GoatJhAstType } from "./generated/ast.js";

export function createRasValidator(services: GoatJhServices) {
    const registry = services.validation.ValidationRegistry;
    const validator: ValidationChecks<GoatJhAstType> = {
        Model: (model: Model, accept: ValidationAcceptor) => {
            RasValidator.checkSingularParent(model, accept);
            RasValidator.checkCrossInheritance(model, accept);
            RasValidator.checkSelfInheritance(model, accept);
        }
    };
    registry.register(validator, {});
}

export class RasValidator {

    // There is an issue currently with the inheritance accept error,
    // it is not displayed correctly. only displays the first element in the inheritance
    static checkSingularParent(model: Model, accept: ValidationAcceptor) {
        const childToParent = new Map<string, string>();
        for (const inheri of model.inheritance) {
            const parentName = inheri.parent?.ref?.name;
            if (!parentName) continue;
            for (const child of inheri.children) {
                const childName = child.ref?.name;
                if (!childName) continue;
                if (childToParent.has(childName)) {
                    accept(
                        'error',
                        `Entity '${childName}' has multiple parents ('${childToParent.get(childName)}', '${parentName}')`,
                        { node: inheri, property: 'children' }
                    );
                } 
                else {
                    childToParent.set(childName, parentName);
                }
            }
        }
    }

static checkCrossInheritance(model: Model, accept: ValidationAcceptor) {
    const childToParent = new Map<string, string>();
    const childToInheritance = new Map<string, Inheritance>();

    for (const inheri of model.inheritance) {
        const parentName = inheri.parent?.ref?.name;
        if (!parentName) continue;
        for (const child of inheri.children) {
            const childName = child.ref?.name;
            if (!childName) continue;
            childToParent.set(childName, parentName);
            childToInheritance.set(childName, inheri);
        }
    }

    
    function findCycle(entity: string, path: string[]): string[] | undefined {
        if (path.includes(entity)) {
            const cycleStart = path.indexOf(entity);
            return path.slice(cycleStart).concat(entity);
        }
        const parent = childToParent.get(entity);
        if (parent) {
            return findCycle(parent, [...path, entity]);
        }
        return undefined;
    }
    
    const reportedCycles = new Set<string>();

    for (const entity of childToParent.keys()) {
        const cycle = findCycle(entity, []);
        if (cycle) {
            // Remove duplicate last element for canonical key
            const cycleNoDup = cycle.slice(0, -1);
            // Find the smallest name for rotation
            const minIdx = cycleNoDup.reduce((minI, name, i) => name < cycleNoDup[minI] ? i : minI, 0);
            // Rotate so smallest name is first
            const normalized = cycleNoDup.slice(minIdx).concat(cycleNoDup.slice(0, minIdx));
            const cycleKey = normalized.join('->');
            if (!reportedCycles.has(cycleKey)) {
                reportedCycles.add(cycleKey);
                for (const name of cycleNoDup) {
                    const inheri = childToInheritance.get(name);
                    if (inheri) {
                        accept(
                            'error',
                            `Inheritance cycle detected: ${cycleNoDup.concat(cycleNoDup[0]).join(' -> ')}`,
                            { node: inheri, property: 'children' }
                        );
                    }
                }
            }
        }
    }
}

    static checkSelfInheritance(model: Model, accept: ValidationAcceptor) {
        for (const inheri of model.inheritance) {
            const parentName = inheri.parent?.ref?.name;
            for (const child of inheri.children) {
                const childName = child.ref?.name;
                if (childName && parentName && childName === parentName) {
                    accept('error', `Entity '${childName}' cannot inherit from itself.`, { node: inheri, property: 'children' });
                }
            }
        }
    }
}