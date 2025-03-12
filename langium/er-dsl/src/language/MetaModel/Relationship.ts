import { Entity } from "./Entity.js";
import { RelationshipAttribute } from "./RelationshipAttribute.js";

export type many = '*';

export type side = "a" | "b";

export type Cardinality = number | many;

export type RelationshipConnection = {
    entity: Entity;
    lower_cardinality: number | many;
    upper_cardinality: number | many;
    identifies: boolean;
}

export class Relationship {
    public name: string;
    public side_a: RelationshipConnection;
    public side_b: RelationshipConnection;
    public is_weak: boolean;
    public attributes: RelationshipAttribute[];

    constructor(name: string, side_a: RelationshipConnection, side_b: RelationshipConnection, attributes: RelationshipAttribute[], is_weak: boolean = false) {
        this.name = name;
        this.side_a = side_a;
        this.side_b = side_b;
        this.is_weak = is_weak;
        this.attributes = attributes;
    }

    public markAsWeak(): void {
        this.is_weak = true;

        //TODO: make this take an entity as argument to mark the correct side as the identifiying side.
        // Consider giving this method the responsiibility of marking the entity as weak too.
    }

    public hasRangedCardinality(side: side): boolean {
        if (side == "a"){
            return this.side_a.lower_cardinality != this.side_a.upper_cardinality;
        }else if (side == "b"){
            return this.side_b.lower_cardinality != this.side_b.upper_cardinality;
        }
        throw Error("Wrong side argument provided: " + side);
    }

    public toString(): string {
        return this.simpleString();
    }


    private simpleString(): string {
        let result: string = '';
        const { entity: entityA } = this.side_a;
        const { entity: entityB } = this.side_b;

        const multiplicityA = `${this.side_a.lower_cardinality}..${this.side_a.upper_cardinality}`;
        const multiplicityB = `${this.side_b.lower_cardinality}..${this.side_b.upper_cardinality}`;

        result += `Relationship: ${this.name} between ${entityA.name} (${multiplicityA}) and ${entityB.name} (${multiplicityB})\n`;
        return result
    }
}