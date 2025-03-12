import type {
    Model as LangiumModel,
    Attribute as LangiumAttribute,
    Entity as LangiumEntity,
    Relationship as LangiumRelationship,
    // Inheritance as LangiumInheritance,
    // MultiRelationShip as LangiumMultiRelationShip,

} from '../generated/ast.js';

import {Entity} from './Entity.js';
import {Cardinality, Relationship, RelationshipConnection} from "./Relationship.js";
import {Attribute, DataType, instantiateDataType} from "./Attribute.js";
import {RelationshipAttribute} from "./RelationshipAttribute.js";

// TODO: add MultiRelationship
type AnyOutputMetaType = Entity | Relationship | "MultiRelationship";

type cardinalityMap = {
    "a": [Cardinality, Cardinality?],
    "b": [Cardinality, Cardinality?]
}

function parseCardinality(cardinality: string): Cardinality {
    if (cardinality === "*") {
        return "*";
    } else {
        return parseInt(cardinality);
    }
}


export function instantiateMetaModelFromLangiumModel(model: LangiumModel): AnyOutputMetaType[] {
    const result: AnyOutputMetaType[] = [];

    const entityMap: Map<string, Entity> = new Map();

    const relationshipMap: Map<string, Relationship> = new Map();

    for (const rawEntity of model.entities) {
        const attributes: Attribute[] = [];
        for (const attribute of rawEntity.attributes) {
            attributes.push(createAttributeFromLangiumAttribute(attribute));
        }
        const entity: Entity = new Entity(rawEntity.name, attributes, false);
        entityMap.set(rawEntity.name, entity);
        result.push(entity);
    }


    for (const rawRelationship of model.relationship) {
        const is_weak = false;

        const sides = rawRelationship.cardinality

        const aCardinalities: Cardinality[] = sides[0].split("..").map(parseCardinality);
        const bCardinalities: Cardinality[] = sides[1].split("..").map(parseCardinality);

        //typescript shenanigans
        const typedACardinalities: [Cardinality, Cardinality?] = [aCardinalities[0]];
        if (aCardinalities.length > 1) {
            typedACardinalities.push(aCardinalities[1]);
        }
        const typedBCardinalities: [Cardinality, Cardinality?] = [bCardinalities[0]];
        if (bCardinalities.length > 1) {
            typedBCardinalities.push(bCardinalities[1]);
        }

        const cardinalities: cardinalityMap = {
            "a": typedACardinalities,
            "b": typedBCardinalities
        }

        const side_a: RelationshipConnection = {
            entity: getEntityFromRef(rawRelationship.entities[0].ref, entityMap),
            lower_cardinality: cardinalities["a"][0],
            upper_cardinality: cardinalities["a"][1] ?? cardinalities["a"][0],
            identifies: false
        };
        const side_b: RelationshipConnection = {
            entity: getEntityFromRef(rawRelationship.entities[1].ref, entityMap),
            lower_cardinality: cardinalities["b"][0],
            upper_cardinality: cardinalities["b"][1] ?? cardinalities["b"][0],
            identifies: false
        };

        const attributes: Attribute[] = [];

        for (const attribute of rawRelationship.attributes) {
            attributes.push(createRelationshipAttributeFromLangiumAttribute(attribute));
        }

        const name = rawRelationship.string_array.join(" "); // TODO: look at whether this is in fact correct
        const relationship: Relationship = new Relationship(name, side_a, side_b, attributes, is_weak);

        relationshipMap.set(rawRelationship.name, relationship);

        result.push(relationship);
    }

    for (const rawIdentifier of model.relationshipidentifiers) {
        const relationship = getRelationshipFromRef(rawIdentifier.identifier.ref, relationshipMap);
        const entity = getEntityFromRef(rawIdentifier.entity.ref, entityMap);
        relationship.markAsWeak(entity);
    }

    //TODO: inheritance
    // TODO: remember inheritance type of overlapping or disjoint


    // TODO: multi-relationship

    return result;

}


function getEntityFromRef(entity: LangiumEntity |undefined, entityMap: Map<string, Entity>): Entity {
    if (entity === undefined) {
        throw new Error("Entity is undefined");
    }

    const entityName = entity.name;
    const foundEntity = entityMap.get(entityName);
    if (foundEntity === undefined) {
        throw new Error("Entity not found: " + entityName);
    }
    return foundEntity;
}

function getRelationshipFromRef(relationship: LangiumRelationship |undefined, relationshipMap: Map<string, Relationship>): Relationship {
    if (relationship === undefined) {
        throw new Error("Relationship is undefined");
    }

    const relationshipName = relationship.name;
    const foundRelationship = relationshipMap.get(relationshipName);
    if (foundRelationship === undefined) {
        throw new Error("Relationship not found: " + relationshipName);
    }
    return foundRelationship;
}

function createAttributeFromLangiumAttribute(attribute: LangiumAttribute): Attribute {
    let is_derived: boolean = false;
    let is_nullable: boolean = false;
    let is_unique: boolean = false;

    let is_foreign_key: boolean = false;
    let is_primary_key: boolean = false;

    for (const keyword of attribute.keywords) {
        switch (keyword as string) {
            case "Derived" || "derived":
                is_derived = true;
                break;
            case "Unique" || "unique" :
                is_unique = true;
                break;
            case "Nullable" || "nullable" :
                is_nullable = true;
                break;
            case "FK" || "fk" :
                is_foreign_key = true;
                break;
            case "PK" || "pk" :
                is_primary_key = true;
                break;
            default:
                throw new Error("Unknown keyword: " + keyword);
        }
    }

    return new Attribute(attribute.name, extractDataTypeFromLangiumType(attribute.type), is_foreign_key, is_primary_key, is_unique, is_nullable, is_derived);
}

function extractDataTypeFromLangiumType(type: string | undefined): DataType |undefined {
    if (type === undefined) {
        return undefined;
    }

    if (type.includes("(")){
        const typename = type.split("(")[0];
        const value = parseInt(type.split("(")[1].replaceAll(")", ""));

        switch (typename[0]) {
            case "char":
                return instantiateDataType("char", value);
            case "varchar":
                return instantiateDataType("varchar", value);
            default:
                throw new Error("Unknown type with (): " + typename);
        }
    }

    switch (type) {
        case "bigint":
            return instantiateDataType("bigint");
        case "boolean" || "bool":
            return instantiateDataType("boolean");
        case "char":
            return instantiateDataType("char");
        case "varchar":
            return  instantiateDataType("varchar");
        case "date":
            return  instantiateDataType("date");
        case "int":
            return  instantiateDataType("int");
        case "real":
            return  instantiateDataType("real");
        case "smallint":
            return instantiateDataType("smallint");
        case "text":
            return instantiateDataType("text");
        case "uuid":
            return instantiateDataType("uuid");
        case "time":
            return instantiateDataType("time");
        case "timestamp":
            return instantiateDataType("timestamp");
        case "float":
            return instantiateDataType("float");
        default:
            throw new Error("Unknown type: " + type);

    }
}

function createRelationshipAttributeFromLangiumAttribute(attribute: LangiumAttribute): RelationshipAttribute {
    return createAttributeFromLangiumAttribute(attribute);
}