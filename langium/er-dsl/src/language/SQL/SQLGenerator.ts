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

    //TODO: Filter entities so they are ordered such that those with foreign keys are defined later.

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
        const needsTrailingComma = entitiesWithForeignKeys.has(entity);
        return `//Entity\nCREATE TABLE ${entity.tableName}(\n${stringAllAttributes(entity.attributes, needsTrailingComma)}${generateForeignKeysIfNeeded(entity, entitiesWithForeignKeys)});`
    });

    outputString += entities.join("\n\n");
    outputString += "\n\n";

    //relationships
    let relationships = n_nRelationships.map(relationship => {
        return `//n_n relationship\n CREATE TABLE ${relationship.sqlName()}` + `(\n` +
            `${stringAllAttributes(relationship.attributes)}` +
            `${generateForeignKeysForRelationship(relationship)}` +
            `);`
    });

    //1-1 relationships
    let oneToOneRelationshipsString = oneToOneRelationships.map(relationship => {
        return `//1-1 relationship\nCREATE TABLE ${relationship.sqlName()}` + `(\n` +
            `${stringAllAttributes(relationship.attributes)}` +
            `${generateForeignKeysForRelationship(relationship)}` +
            `);`
    });


    outputString += oneToOneRelationshipsString.join("\n\n");
    outputString += "\n\n";
    outputString += relationships.join("\n\n");
    outputString += "\n\n";

    //TODO: Multirelationships
    // TODO: inheritance

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
        let attrs = stringAllAttributes(relationship.attributes);

        if (attrs){
            output += ",\n" + attrs;
        }

        return output;
    });

    return "\t" + foreignKeys.join(",\n\t") + "\n";
}

function generateForeignKeyToEntity(entity: Entity, extraname: string, nullable: boolean = false): string {
    let output = `${extraname}_${entity.tableName}_${entity.nameOfPrimaryKey} ${entity.primaryKey.getSqlRepresentationOfDataType(true)} REFERENCES ${entity.tableName}(${entity.nameOfPrimaryKey})`

    if (!nullable) {
        output += " NOT NULL";
    }

    return output;
}

function generateForeignKeysForRelationship(relationship: MultiRelationship): string {
    const keys = relationship.connections.map(connection => {
        let text = generateForeignKeyToEntity(connection.entity, relationship.sqlName());
        if (connection.lower_cardinality == "*" || connection.lower_cardinality > 0) {
            text += " NOT NULL";
        } 
        if (connection.upper_cardinality != "*" && connection.upper_cardinality <= 1) {
            text += " UNIQUE";
        }
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
    const nullable = !attribute.is_nullable || attribute.is_primary_key ? ' NOT NULL' : '';
    const unique = attribute.is_unique && !attribute.is_primary_key ? ' UNIQUE' : '';

    return `${attribute.name}${datatype}${pk}${nullable}${unique}`;
}

function stringAllAttributes(attributes: Attribute[], trailing_comma: boolean = false): string {
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