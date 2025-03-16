import { expandToNode, toString } from 'langium/generate';
import * as fs from 'fs';
import * as path from 'path';

import { AnyOutputMetaType } from '../MetaModel/Instantiator.js';
import { Entity } from '../MetaModel/Entity.js';
import { Relationship } from '../MetaModel/Relationship.js';
import { Attribute } from '../MetaModel/Attribute.js';

export function generateUMLDiagram(model: AnyOutputMetaType[]): string {
    const entities: Entity[] = model.filter((i): i is Entity => i instanceof Entity);
    const relationships: Relationship[] = model.filter((i): i is Relationship => i instanceof Relationship);

    const fileNode = expandToNode`
        @startchen

        ${entities.map((entity) => {
            return `entity ${entity.name} {
                ${entity.attributes.map((attribute) => {
                    return `${attribute.name} : ${attribute.datatype?.name}`;
                }).join('\n')}
            }`;
        }).join('\n\n')}
        
        @endchen
    `.appendNewLineIfNotEmpty();

    const fileContent = toString(fileNode);

    return fileContent;
}