import {InstantiatedOutput} from "../MetaModel/Instantiator.js";
import {Attribute} from "../MetaModel/Attribute.js";
import {Entity} from "../MetaModel/Entity.js";
import {cardinalityIsSingular, Relationship} from "../MetaModel/Relationship.js";
import {MultiRelationship} from "../MetaModel/MultiRelationship.js";
import {ForeignPKAttribute} from "../MetaModel/ForeignPKAttribute.js";
import {generateForeignKeyToEntity} from "./SQLHelper.js";

type ForeignKeyMap = Map<Entity, Relationship[]>


export function generateSQLFile(output: InstantiatedOutput): string {
    let outputString = '';

    const singleDirectionRelationships = output.relationships.filter(relationship => relationship.hasSideWithSingularCardinality(false));
    const n_nRelationships = output.relationships.filter(relationship => !relationship.hasSideWithSingularCardinality(false));
    // TODO: Check 0..1-n relationships. They should be made as a separate table and not as part of the 1-n relationships.

    const entitiesWithForeignKeys: ForeignKeyMap = new Map();
    const oneToOneRelationships: Relationship[] = [];

    const zeroOrOneToOneRelationships: Relationship[] = [];

    //TODO: Filter entities so they are ordered such that those with foreign keys are defined later.
    // Does this mean that we should perform some model validation to notice circular dependencies?
    // A 1-* B, B 1-* C, C 1-* A. We can implement it, but at least one of them will have to be made with an extra table like a 0..1-n relationship.

    for (const relationship of singleDirectionRelationships) {
        const filtered = relationship.connections.filter(connection => !cardinalityIsSingular(connection.upper_cardinality, false));

        if (filtered.length == 0) {
            oneToOneRelationships.push(relationship);
            continue;
        } else if (filtered.length > 1) {
            throw new Error("Something is very wrong with the determination of 1-n relationships. After filtering more than one had a cardinality of more than 1: " + relationship);
        }

        // Filter 0..1-n relationships
        const zeroOrOneToOne = relationship.connections.filter(connection => connection.upper_cardinality == 1 && connection.lower_cardinality == 0);
        if (zeroOrOneToOne.length > 0) {
            zeroOrOneToOneRelationships.push(relationship);
            continue;
        }

        const entity = filtered[0].entity;
        if (!entitiesWithForeignKeys.has(entity)) {
            entitiesWithForeignKeys.set(entity, []);
        }
        entitiesWithForeignKeys.get(entity)!.push(relationship);
    }// These have 1-n or n-1 relationships. These should be considered when generating the entity tables below


    for (const entity of output.entities) {
        for (const child of entity.children) {
            child.setParent(entity);
        }
    }

    // Populate all primary keys
    for (const entity of output.entities) {
        entity.getPrimaryKey()
    }

    //entities
    let entities = output.entities.map(entity => {
        const needsTrailingComma = entitiesWithForeignKeys.has(entity);
        return `--Entity\nCREATE TABLE ${entity.tableName}(\n${stringAllAttributes(entity.attributes, needsTrailingComma)}${generateForeignKeysIfNeeded(entity, entitiesWithForeignKeys)});`
    });

    outputString += entities.join("\n\n");
    outputString += "\n\n";

    //relationships
    let relationships = n_nRelationships.map(relationship => {
        return `--n_n relationship\n CREATE TABLE ${relationship.sqlName()}` + `(\n` +
            `${stringAllAttributes(relationship.attributes)}` +
            `${generateForeignKeysForRelationship(relationship)}` +
            `);`
    });

    //1-1 relationships
    let oneToOneRelationshipsString = oneToOneRelationships.map(relationship => {
        return `--1-1 relationship\nCREATE TABLE ${relationship.sqlName()}` + `(\n` +
            `${stringAllAttributes(relationship.attributes)}` +
            `${generateForeignKeysForRelationship(relationship)}` +
            `);`
    });

    //0..1-n relationships
    let zeroOrOneRelationshipsString = zeroOrOneToOneRelationships.map(relationship => {
        return `--0..1-n relationship\nCREATE TABLE ${relationship.sqlName()}` + `(\n` +
            `${stringAllAttributes(relationship.attributes)}` +
            `${generateForeignKeysForRelationship(relationship)}` +
            `);`
    });


    outputString += oneToOneRelationshipsString.join("\n\n");
    outputString += "\n\n";
    outputString += relationships.join("\n\n");
    outputString += "\n\n";
    outputString += zeroOrOneRelationshipsString.join("\n\n");
    outputString += "\n\n";

    //TODO: Multirelationships. Talk with Jakob how we should accurately handle cardinalities, because i believe even the lectures are missing info.
    const multiStrings = output.multiRelationships.map(relationship => {
        return `--Multi relationship\nCREATE TABLE ${relationship.sqlName()}` + `(\n` +
            `${stringAllAttributes(relationship.attributes)}` +
            `${generateForeignKeysForRelationship(relationship)}` +
            `);`
    });

    outputString += multiStrings.join("\n\n");
    outputString += "\n\n";

    return outputString;
}

function generateForeignKeysIfNeeded(entity: Entity, entitiesWithForeignKeys: ForeignKeyMap): string {
    if (!entitiesWithForeignKeys.has(entity)) {
        return "";
    }

    const relationships = entitiesWithForeignKeys.get(entity)!;
    const foreignKeys = relationships.map(relationship => {
        const connection = relationship.connections.find(connection => connection.entity != entity)!;
        let output = generateForeignKeyToEntity(connection.entity, relationship.sqlName());
        let attrs = stringAllAttributes(relationship.attributes, false);

        if (attrs) {
            output += ",\n" + attrs;
        }

        return output;
    });

    return "\t" + foreignKeys.join(",\n\t") + "\n";
}


function generateForeignKeysForRelationship(relationship: MultiRelationship): string {
    // If the relationship is not multiple, then we should switch the cardinalities of the connections to properly generate the intent behind the connections.
    if (relationship.connections.length == 2) {
        const connection1Entity = relationship.connections[0].entity;
        const connection2Entity = relationship.connections[1].entity;

        relationship.connections[0].entity = connection2Entity;
        relationship.connections[1].entity = connection1Entity;
    }

    const keys = relationship.connections.map(connection => {
        let text = generateForeignKeyToEntity(connection.entity, relationship.sqlName(), false);

        if (connection.upper_cardinality != "*" && connection.upper_cardinality <= 1) {
            text += " UNIQUE";
        }
        return text;
    });

    return "\t" + keys.join(",\n\t") + "\n";
}

function stringSingleAttribute(attribute: Attribute): string {
    if (attribute instanceof ForeignPKAttribute) {
        return attribute.toSQLString();
    }

    let datatype = attribute.getSqlRepresentationOfDataType()
    if (datatype) {
        datatype = ` ${datatype}`;
    }

    const pk = attribute.is_primary_key ? ' PRIMARY KEY' : '';
    const nullable = !attribute.is_nullable || attribute.is_primary_key ? ' NOT NULL' : '';
    const unique = attribute.is_unique && !attribute.is_primary_key ? ' UNIQUE' : '';

    return `${attribute.name}${datatype}${pk}${nullable}${unique}`;
}

function stringAllAttributes(attributes: Attribute[], trailing_comma: boolean = true): string {
    if (attributes.length == 0) {
        return "";
    }
    const trailing_comma_text = trailing_comma ? "," : "";
    return "\t" + attributes.map(stringSingleAttribute).join(",\n\t") + trailing_comma_text + "\n";
}


// Possible features:
// - Generate indexes
// - Generate foreign keys
// - Generate constraints (like in ranged cardinality) (cardinality that is larger than 1, but not *)

// Sort the table creation order to have those without relationships first
// When the cardinality is 0..1 the table design depends on the other side of the relationship.