import { expandToNode, toString } from 'langium/generate';
import * as fs from 'fs';
import * as path from 'path';

import { AnyOutputMetaType } from '../MetaModel/Instantiator.js';
import { Entity } from '../MetaModel/Entity.js';
import { Relationship, RelationshipConnection } from '../MetaModel/Relationship.js';
import { Attribute } from '../MetaModel/Attribute.js';

export function generateUMLDiagram(model: AnyOutputMetaType[]): string {
    const entities: Entity[] = model.filter((i): i is Entity => i instanceof Entity);
    const relationships: Relationship[] = model.filter((i): i is Relationship => i instanceof Relationship);

    // Todo: Change the way relationships are identified, so that it says as "id" instead
    const fileNode = expandToNode`
        @startchen

        ${entities.map((entity) => {
            return `entity ${entity.name} ${entity.is_weak ? '<<weak>>' : ''} {
                ${entity.attributes.map((attribute) => {
                    return `${attribute.name} : ${getDataTypeString(attribute)} ${generateKeyword(attribute)}`;
                }).join('\n')}
            }`;
        }).join('\n\n')}

        ${relationships.map((relationship) => {
            return `relationship "${relationship.name}" as ${relationship.name} ${relationship.is_weak ? "<<identifying>>" : ""} {
                ${relationship.attributes.map((attribute) => {
                    return `${attribute.name} : ${getDataTypeString(attribute)} ${generateKeyword(attribute)}`;
                }).join('\n')}
            }`;
        }).join('\n\n')}

        ${relationships.map((relationship) => {
            return `
                ${relationship.name} -${getCardinality(relationship.side_a)}- ${relationship.side_a.entity.name} \n
                ${relationship.name} -${getCardinality(relationship.side_b)}- ${relationship.side_b.entity.name}
            `;
        }).join('\n\n')}
        
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

function getCardinality(side: RelationshipConnection): string {
    if (side.lower_cardinality == side.upper_cardinality){
        return `${convertAsteriskToN(side.lower_cardinality)}`;
    }else {
        return `(${convertAsteriskToN(side.lower_cardinality)},${convertAsteriskToN(side.upper_cardinality)})`;
    }
}

function convertAsteriskToN(cardinality: number | "*"): string | number {
    if (cardinality == "*"){
        return "n";
    }
    return cardinality;
}


