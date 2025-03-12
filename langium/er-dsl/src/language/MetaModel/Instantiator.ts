import type {
    Model as LangiumModel,
    Attribute as LangiumAttribute,
    Entity as LangiumEntity,
    Relationship as LangiumRelationship,
    Inheritance as LangiumInheritance,
    MultiRelationShip as LangiumMultiRelationShip,

} from '../generated/ast.js';

import {Entity} from './Entity';
import {Relationship, RelationshipConnection} from "./Relationship.js";
import {Attribute} from "./Attribute.js";
import {RelationshipAttribute} from "./RelationshipAttribute.js";

type AnyMetaType = Entity | Relationship | Attribute | RelationshipAttribute;
// TODO: add MultiRelationship
type AnyOutputMetaType = Entity | Relationship | "MultiRelationship";


export function instantiateMetaModelFromLangiumModel(model: LangiumModel): AnyOutputMetaType[] {
    const result: AnyMetaType[] = [];

    const entityMap: Map<string, Entity> = new Map();

    for (const rawEntity of model.entities) {
        const attributes: Attribute[] = [];
        for (const attribute of rawEntity.attributes) {
            attributes.push(createAttributeFromLangiumAttribute(attribute));
        }
        const entity: Entity = new Entity(rawEntity.name, attributes, isEntityWeak(rawEntity));
        entityMap.set(rawEntity.name, entity);
        result.push(entity);
    }


    for (const rawRelationship of model.relationship) {
        const is_weak = isRelationshipWeak(rawRelationship);

        const side_a: RelationshipConnection = {
            entity: entityMap.get(rawRelationship.entities[0]) as Entity,
            lower_cardinality: 0,
            upper_cardinality: "*", //TODO, get this from the language
            identifies: false //TODO: support identifies in language
        };
        const side_b: RelationshipConnection = {
            entity: entityMap.get(rawRelationship.entities[1]) as Entity,
            lower_cardinality: 0,
            upper_cardinality: 1,
            identifies: false //TODO: support identifies in language
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

function isEntityWeak(entity: LangiumEntity): boolean {
    console.warn("isEntityWeak not implemented"); //TODO: Support weak in language
    return false;
}

function isRelationshipWeak(relationship: LangiumRelationship): boolean {
    console.warn("isRelationshipWeak not implemented"); //TODO: Support weak in language
    return false;
}

function createAttributeFromLangiumAttribute(attribute: LangiumAttribute): Attribute {
    let is_derived: boolean = false;
    let is_nullable: boolean = false;
    let is_unique: boolean = false;

    let is_foreign_key: boolean = false;
    let is_primary_key: boolean = false;

    for (const keyword of attribute.keywords) {
        //TODO: make this more flexible with user input (and change to a switch maybe)
        //TODO: read PK and FK
        if (keyword === "Derived" || keyword === "derived") {
            is_derived = true;
            continue;
        }
        if (keyword === "Unique" || keyword === "unique") {
            is_unique = true;
            continue;
        }
        if (keyword === "Nullable" || keyword === "nullable") {
            is_nullable = true;
            continue;
        }
        throw new Error("Unknown keyword: " + keyword);
    }

    return new Attribute(attribute.name, attribute.type ?? "unknown", is_foreign_key, is_primary_key, is_unique, is_nullable, is_derived);
}

function createRelationshipAttributeFromLangiumAttribute(attribute: LangiumAttribute): RelationshipAttribute {
    return createAttributeFromLangiumAttribute(attribute);
}