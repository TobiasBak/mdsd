import type {
    Model as LangiumModel,
    Attribute as LangiumAttribute,
    Entity as LangiumEntity,
    Relationship as LangiumRelationship,
    TYPES as LangiumTYPES,
    // Inheritance as LangiumInheritance,
    // MultiRelationShip as LangiumMultiRelationShip,

} from '../generated/ast.js';

import {Entity} from './Entity.js';
import {Relationship} from "./Relationship.js";
import {Cardinality, MultiRelationship, RelationshipConnection} from "./MultiRelationship.js";
import {Attribute, DataType, instantiateDataType} from "./Attribute.js";
import {RelationshipAttribute} from "./RelationshipAttribute.js";
import {leftRecursionCalculator} from "../left-recursion-calculator.js";

export type InstantiatedOutput = {
    entities: Entity[],
    relationships: Relationship[],
    multiRelationships: MultiRelationship[]
}

type CardinalityRange = {
    lower: Cardinality,
    upper: Cardinality
}

type RelationshipMapType = Map<number, Relationship>;

function parseCardinality(cardinality: string): Cardinality {
    if (cardinality === "*") {
        return "*";
    } else {
        return parseInt(cardinality);
    }
}

function extractCardinalitiesFromCardinalityArray(cardinalityArray: Array<'*' | number | string>): CardinalityRange[] {
    //todo: fix this with the new type
    const output: CardinalityRange[] = [];
    for (let cardinality of cardinalityArray) {
        cardinality = `${cardinality}`;
        const cardinalities = cardinality.split("..");
        if (cardinalities.length == 1) {
            cardinalities.push(cardinalities[0]);
        }
        output.push({lower: parseCardinality(cardinalities[0]), upper: parseCardinality(cardinalities[1])});
    }

    if (output.length < 2){
        throw new Error(`Cardinality array from '${cardinalityArray}' must have at least 2 elements, but has ${output.length}`);
    }

    return output;
}


function createAttributesForRelationship(rawAttributes: LangiumAttribute[]) {
    const attributes: RelationshipAttribute[] = [];
    for (const attribute of rawAttributes) {
        attributes.push(createRelationshipAttributeFromLangiumAttribute(attribute));
    }
    return attributes;
}

export function instantiateMetaModelFromLangiumModel(model: LangiumModel): InstantiatedOutput {
    const result: InstantiatedOutput = {
        entities: [],
        relationships: [],
        multiRelationships: []
    };

    const entityMap: Map<string, Entity> = new Map();

    const relationshipMap: RelationshipMapType = new Map();
    const multiRelationshipMap: Map<number, MultiRelationship> = new Map();

    for (const rawEntity of model.entities) {
        const attributes: Attribute[] = [];
        for (const attribute of rawEntity.attributes) {
            attributes.push(createAttributeFromLangiumAttribute(attribute));
        }
        const entity: Entity = new Entity(rawEntity.name, attributes, false);
        entityMap.set(rawEntity.name, entity);
        result.entities.push(entity);
    }


    for (const rawRelationship of model.relationship) {
        const is_weak = false;
        const cardinalities = extractCardinalitiesFromCardinalityArray(rawRelationship.cardinality);

        const side_a: RelationshipConnection = {
            entity: getEntityFromRef(rawRelationship.entities[0].ref, entityMap),
            lower_cardinality: cardinalities[0].lower,
            upper_cardinality: cardinalities[0].upper,
            identifies: false
        };
        const side_b: RelationshipConnection = {
            entity: getEntityFromRef(rawRelationship.entities[1].ref, entityMap),
            lower_cardinality: cardinalities[1].lower,
            upper_cardinality: cardinalities[1].upper,
            identifies: false
        };

        const attributes: Attribute[] = createAttributesForRelationship(rawRelationship.attributes);

        const name = rawRelationship.string_array.join(" "); // TODO: look at whether this is in fact correct
        const relationship: Relationship = new Relationship(name, side_a, side_b, attributes, is_weak);

        relationshipMap.set(rawRelationship.name, relationship);

        result.relationships.push(relationship);
    }

    for (const rawIdentifier of model.relationshipidentifiers) {
        // console.log("rawIdentifier: ", rawIdentifier);
        const relationship = getRelationshipFromId(rawIdentifier.identifier, relationshipMap);
        const entity = getEntityFromRef(rawIdentifier.entity.ref, entityMap);
        relationship.markAsWeak(entity);
    }


    for ( const inheritance of model.inheritance) {
        const parentEntity = getEntityFromRef(inheritance.parent.ref, entityMap);
        for (const child of inheritance.children) {
            const childEntity = getEntityFromRef(child.ref, entityMap);
            parentEntity.addChild(childEntity);
        }
    }

    for (const inheritanceType of model.inheritanceType){
        const entity = getEntityFromRef(inheritanceType.entity.ref, entityMap);
        if (inheritanceType.type == "disjointed"){
            entity.setInheritanceType("disjoint");
        }else if(inheritanceType.type == "overlapping"){
            entity.setInheritanceType("overlapping");
        }else {
            throw new Error("Unknown inheritance type: " + inheritanceType.type);
        }
    }

    for (const multiRelationship of model.multirelation){
        const connections: RelationshipConnection[] = [];
        const cardinalities = extractCardinalitiesFromCardinalityArray(multiRelationship.cardinality);
        for (let i: number = 0; i < multiRelationship.entities.length; i++){
            const entity = getEntityFromRef(multiRelationship.entities[i].ref, entityMap);
            const lower_cardinality = cardinalities[i].lower;
            const upper_cardinality = cardinalities[i].upper;
            const identifies = false; // TODO: should this be available in the language?
            connections.push({entity, lower_cardinality, upper_cardinality, identifies});
        }

        const attributes = createAttributesForRelationship(multiRelationship.attributes);
        const name = multiRelationship.string_array.join(" ");
        const multiRel = new MultiRelationship(name, connections, attributes);
        multiRelationshipMap.set(multiRelationship.name, multiRel);
        //TODO: entity can be identified by multi relationship? (currently not in the language, but maybe should be)

        result.multiRelationships.push(multiRel);
    }

    return result;

}


function getEntityFromRef(entity: LangiumEntity | undefined, entityMap: Map<string, Entity>): Entity {
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

function getRelationshipFromRef(relationship: LangiumRelationship | undefined, relationshipMap: RelationshipMapType): Relationship {
    if (relationship === undefined) {
        throw new Error(`Relationship is undefined in map with keys: ${Array.from(relationshipMap.keys()).join(", ")}`);
    }

    const relationshipName = relationship.name;
    const foundRelationship = relationshipMap.get(relationshipName);
    if (foundRelationship === undefined) {
        throw new Error("Relationship not found: " + relationshipName);
    }
    return foundRelationship;
}

function getRelationshipFromId(id: number, relationshipMap: RelationshipMapType): Relationship {
    const foundRelationship = relationshipMap.get(id);
    if (foundRelationship === undefined) {
        throw new Error("Relationship not found: " + id);
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
            case "derived":
            case "Derived":
                is_derived = true;
                break;
            case "Unique":
            case "unique" :
                is_unique = true;
                break;
            case "Nullable" :
            case "nullable" :
                is_nullable = true;
                break;
            case "FK" :
            case "fk" :
                is_foreign_key = true;
                break;
            case "PK" :
            case "pk" :
                is_primary_key = true;
                break;
            default:
                throw new Error("Unknown keyword: '" + keyword + "'");
        }
    }

    return new Attribute(attribute.name, extractDataTypeFromLangiumType(attribute.type), is_foreign_key, is_primary_key, is_unique, is_nullable, is_derived);
}

function extractDataTypeFromLangiumType(type: LangiumTYPES | undefined): DataType | undefined {
    if (type === undefined) {
        return undefined;
    }

    if (type.value !== undefined) {
        const value: number = Math.ceil(leftRecursionCalculator(type.value));

        switch (type.type) {
            case "char":
                return instantiateDataType("char", value);
            case "varchar":
                return instantiateDataType("varchar", value);
            default:
                throw new Error("Unknown type with (): '" + type.type + "'");
        }
    }

    switch (type.type) {
        case "bigint":
            return instantiateDataType("bigint");
        case "boolean" || "bool":
            return instantiateDataType("boolean");
        case "char":
            return instantiateDataType("char");
        case "varchar":
            return instantiateDataType("varchar");
        case "date":
            return instantiateDataType("date");
        case "int":
            return instantiateDataType("int");
        case "real":
            return instantiateDataType("real");
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