import { expandToNode, toString } from 'langium/generate';

import { Entity } from '../MetaModel/Entity.js';
import { Relationship } from '../MetaModel/Relationship.js';
import { Attribute } from '../MetaModel/Attribute.js';
import { InstantiatedOutput } from '../MetaModel/Instantiator.js';
import { MultiRelationship, RelationshipConnection } from '../MetaModel/MultiRelationship.js';

export function generateUMLDiagram(model: InstantiatedOutput): string {
    const entities: Entity[] = model.entities;
    const relationships: Relationship[] = model.relationships;
    const multiRelationships: MultiRelationship[] = model.multiRelationships;

    // Todo: Change the way relationships are identified, so that it says as "id" instead
    const fileNode = expandToNode`
        @startchen

        ${entities.map(entity => entity.toPlantWithAttribute()).join('\n\n')}

        ${relationships.map(relationship => relationship.toPlantUMLWithAttribute()).join('\n\n')}

        ${relationships.map(relationship => relationship.toPlantUMLCardinality()).join('\n\n')}

        ${entities.map(entity => entity.generatePlantUMLRelations()).join('\n\n')}
        
        ${multiRelationships.map((relationship) => relationship.toPlantUML())}
        
        @endchen
    `.appendNewLineIfNotEmpty();
    // TODO: Inheritance + multi relationships

    const fileContent = toString(fileNode);

    return fileContent;
}