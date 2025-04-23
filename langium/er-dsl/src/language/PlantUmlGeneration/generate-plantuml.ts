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

        ${entities.map(entity => entity.toPlantWithAttribute(getDataTypeString, generateKeyword)).join('\n\n')}

        ${relationships.map(relationship => relationship.toPlantUMLWithAttribute(getDataTypeString, generateKeyword)).join('\n\n')}

        ${relationships.map(relationship => relationship.toPlantUMLCardinality()).join('\n\n')}

        ${entities.map(entity => entity.toPlantUML()).join('\n\n')}
        
        ${multiRelationships.map((relationship) => {relationship.toPlantUML()})}
        
        @endchen
    `.appendNewLineIfNotEmpty();
    // TODO: Inheritance + multi relationships

    const fileContent = toString(fileNode);

    return fileContent;
}

function generateKeyword(attribute: Attribute): string {
    let out = ' ';
    console.log(attribute);

    if (attribute.is_primary_key) {
        out += '<<key>> ';
    }
    
    //if (attribute.is_foreign_key) {
    //    out += '<<FK>> ';
    //}
    //if (attribute.is_unique) {
    //    out += '<<Unique>> ';
    //}
    //if (attribute.is_nullable) {
    //    out += '<<nullable>> ';
    //}

    if (attribute.is_derived) {
        out += '<<derived>> ';
    }

    return out;
}

function getDataTypeString(attribute: Attribute): string {
    if (attribute.datatype?.value != undefined){
        return `${attribute.datatype.name} ${attribute.datatype.value}`;
    }
    return `${attribute.datatype?.name}`;
}




