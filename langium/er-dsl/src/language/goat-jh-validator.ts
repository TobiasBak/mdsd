import type { ValidationChecks, ValidationAcceptor } from 'langium';
import type { Entity, GoatJhAstType } from './generated/ast.js';
import type { GoatJhServices } from './goat-jh-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: GoatJhServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.GoatJhValidator;
    const checks: ValidationChecks<GoatJhAstType> = {
        // Entity: (entity, accept) => validator.checkPersonStartsWithCapital(entity, accept)
        
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class GoatJhValidator {

    // checkPersonStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void {
    //    if (entity.name) {
    //        const firstChar = entity.name.substring(0, 1);
    //        if (firstChar.toUpperCase() !== firstChar) {
    //            accept('warning', 'Entity name should start with a capital.', { node: entity, property: 'name' });
    //        }
    //    }
    // }

}
