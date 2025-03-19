import {InstantiatedOutput} from "../MetaModel/Instantiator.js";
import {Attribute} from "../MetaModel/Attribute.js";
import {Entity} from "../MetaModel/Entity.js";
import {cardinalityIsSingular, Relationship} from "../MetaModel/Relationship.js";
import {MultiRelationship} from "../MetaModel/MultiRelationship.js";

type ForeignKeyMap = Map<Entity, Relationship[]>


export function generateSQLFile(output: InstantiatedOutput): string {
    let outputString = '';

    const singleDirectionRelationships = output.relationships.filter(relationship => relationship.hasSideWithSingularCardinality(false));
    const n_nRelationships = output.relationships.filter(relationship => !relationship.hasSideWithSingularCardinality(false));

    const entitiesWithForeignKeys: ForeignKeyMap = new Map();
    const oneToOneRelationships: Relationship[] = [];

    for (const relationship of singleDirectionRelationships) {
        const filtered = relationship.connections.filter(connection => !cardinalityIsSingular(connection.upper_cardinality, false));

        if (filtered.length == 0) {
            oneToOneRelationships.push(relationship);
            continue;
        } else if (filtered.length > 1) {
            throw new Error("Something is very wrong with the determination of 1-n relationships. After filtering more than one had a cardinality of more than 1: " + relationship);
        }

        const entity = filtered[0].entity;
        if (!entitiesWithForeignKeys.has(entity)) {
            entitiesWithForeignKeys.set(entity, []);
        }
        entitiesWithForeignKeys.get(entity)!.push(relationship);
    }// These have 1-n or n-1 relationships. These should be considered when generating the entity tables below

    //entities
    let entities = output.entities.map(entity => {
        return `//Entity\nCREATE TABLE ${entity.tableName}(\n${stringAllAttributes(entity.attributes)}${generateForeignKeysIfNeeded(entity, entitiesWithForeignKeys)});`
    });

    outputString += entities.join("\n\n");
    outputString += "\n\n";

    // The ones with 1-1 should be in a separate table where foreign keys are unique not null. These tables are made after entities
    // n-n should be parsed after entities are created

    //relationships
    let relationships = n_nRelationships.map(relationship => {
        return `//n_n relationship\n CREATE TABLE ${relationship.sqlName()}` + `(\n` +
            `${stringAllAttributes(relationship.attributes)}` +
            `${generateForeignKeysForRelationship(relationship)}` +
            `);`
    });

    outputString += relationships.join("\n\n");
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
        return generateForeignKeyToEntity(connection.entity, relationship.sqlName());
    });

    return "\t" + foreignKeys.join(",\n\t") + "\n";
}

function generateForeignKeyToEntity(entity: Entity, extraname: string): string {
    return `${extraname}_${entity.tableName}_${entity.nameOfPrimaryKey} ${entity.primaryKey.getSqlRepresentationOfDataType(true)} REFERENCES ${entity.tableName}(${entity.nameOfPrimaryKey})`;
}

function generateForeignKeysForRelationship(relationship: MultiRelationship): string {
    console.log("Generating foreign keys for relationship: ", relationship);
    const keys = relationship.connections.map(connection => {
        const text = generateForeignKeyToEntity(connection.entity, relationship.sqlName());
        console.log("Generated foreign key: ", text);
        return text;
    });

    return "\t" + keys.join(",\n\t") + "\n";
}

function stringSingleAttribute(attribute: Attribute): string {
    let datatype = attribute.getSqlRepresentationOfDataType()
    if (datatype) {
        datatype = ` ${datatype}`;
    }

    const pk = attribute.is_primary_key ? ' PRIMARY KEY' : '';
    const nullable = attribute.is_nullable || attribute.is_primary_key ? '' : ' NOT NULL';
    const unique = attribute.is_unique && !attribute.is_primary_key ? ' UNIQUE' : '';

    return `${attribute.name}${datatype}${pk}${nullable}${unique}`;
}

function stringAllAttributes(attributes: Attribute[]): string {
    if (attributes.length == 0) {
        return "";
    }
    return "\t" + attributes.map(stringSingleAttribute).join(",\n\t") + "\n";
}


// Possible features:
// - Generate indexes
// - Generate foreign keys
// - Generate constraints (like in ranged cardinality) (cardinality that is larger than 1, but not *)

// Sort the table creation order to have those without relationships first
// When the cardinality is 0..1 the table design depends on the other side of the relationship.