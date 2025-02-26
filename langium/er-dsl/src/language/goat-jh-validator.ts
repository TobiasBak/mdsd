import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { GoatJhAstType, Person } from './generated/ast.js';
import type { GoatJhServices } from './goat-jh-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: GoatJhServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.GoatJhValidator;
    const checks: ValidationChecks<GoatJhAstType> = {
        Person: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class GoatJhValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}
