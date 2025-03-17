import type { ValidationChecks, ValidationAcceptor } from 'langium';
import type { Attribute, Entity, GoatJhAstType } from './generated/ast.js';
import type { GoatJhServices } from './goat-jh-module.js';
import { integer } from 'vscode-languageserver';
import { b } from 'vitest/dist/suite-a18diDsI.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: GoatJhServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.GoatJhValidator;
    const checks: ValidationChecks<GoatJhAstType> = {
        Attribute: (attribute, accept) => validator.attributeChecks(attribute, accept),
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class GoatJhValidator {

    attributeChecks(attribute: Attribute, accept: ValidationAcceptor): void {
        this.checkEntityOnlyHasOneKey(attribute, accept);
        this.checkAttributeDoesNotHaveDuplicateKeywords(attribute, accept);
    }

    checkEntityOnlyHasOneKey(attribute: Attribute, accept: ValidationAcceptor): void {
        const keystrings: string[] = ['pk', 'PK', 'fk', 'FK'];
        let keyCount2 = 0;

        attribute.keywords.forEach(keyword => {
            if (keystrings.includes(keyword)) {
                keyCount2++;
            }
        });
        if (keyCount2 > 1) {
            accept('warning', 'An Entity attribute should only have one primary key or one foreing key.', { node: attribute, property: 'keywords' });
        }
    }

    checkAttributeDoesNotHaveDuplicateKeywords(attribute: Attribute, accept: ValidationAcceptor): void {
        attribute.keywords = attribute.keywords.map(keyword => keyword.toLowerCase());
        for (let i = 0; i < attribute.keywords.length; i++) {
            for (let j = i + 1; j < attribute.keywords.length; j++) {
                if (attribute.keywords[i] === attribute.keywords[j]) {
                    accept('warning', 'One or more keywords are duplicate.', { node: attribute, property: 'keywords' });
                    break;
                }
            }
        }        
    }


}
        
