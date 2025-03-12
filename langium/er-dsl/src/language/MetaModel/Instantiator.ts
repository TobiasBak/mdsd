import type {
    Model as LangiumModel,
    Attribute as LangiumAttribute,
    // Entity as LangiumEntity,
    // Relationship as LangiumRelationship,
    // Inheritance as LangiumInheritance,
    // MultiRelationShip as LangiumMultiRelationShip,

} from '../generated/ast.js';

import {Entity} from './Entity.js';
import {Cardinality, Relationship, RelationshipConnection} from "./Relationship.js";
import {Attribute} from "./Attribute.js";
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

        const sides = rawRelationship.relationship.split("-")

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
            entity: entityMap.get(rawRelationship.entities[0]) as Entity,
            lower_cardinality: cardinalities["a"][0],
            upper_cardinality: cardinalities["a"][1] ?? cardinalities["a"][0],
            identifies: false
        };
        const side_b: RelationshipConnection = {
            entity: entityMap.get(rawRelationship.entities[1]) as Entity,
            lower_cardinality: cardinalities["b"][0],
            upper_cardinality: cardinalities["b"][1] ?? cardinalities["b"][0],
            identifies: false
        };

        const attributes: Attribute[] = [];

        for (const attribute of rawRelationship.attributes) {
            attributes.push(createRelationshipAttributeFromLangiumAttribute(attribute));
        }

        const name = rawRelationship.relationship;
        const relationship: Relationship = new Relationship(name, side_a, side_b, attributes, is_weak);
        result.push(relationship);
    }

    //TODO: inheritance and multi-relationship
    // TODO: remember inheritance type of overlapping or disjoint

    // TODO: parse relationshipidentifiers and mark entities as weak
    // When parsing relationshipidentifiers mark the relationship as weak too

    return result;

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

    return new Attribute(attribute.name, attribute.type ?? "unknown", is_foreign_key, is_primary_key, is_unique, is_nullable, is_derived);
}

function createRelationshipAttributeFromLangiumAttribute(attribute: LangiumAttribute): RelationshipAttribute {
    return createAttributeFromLangiumAttribute(attribute);
}