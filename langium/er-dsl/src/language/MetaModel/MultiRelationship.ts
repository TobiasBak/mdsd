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

export class MultiRelationship {
    public name: string;
    public connections: RelationshipConnection[];
    public is_weak: boolean;
    public attributes: RelationshipAttribute[];

    entityMap: Map<Entity, RelationshipConnection>;

    constructor(name: string, connections: RelationshipConnection[], attributes: RelationshipAttribute[], is_weak: boolean = false) {
        this.name = name;
        this.connections = connections;
        this.is_weak = is_weak;
        this.attributes = attributes;

        this.entityMap = new Map();
        for (const connection of connections){
            this.entityMap.set(connection.entity, connection);
        }
    }

    public markAsWeak(entity: Entity): void {
        this.is_weak = true;

        const applicableConnection = this.entityMap.get(entity);
        if (applicableConnection){
            applicableConnection.identifies = true;
            entity.markAsWeak()
        }else {
            throw Error(`Entity ${entity.name} is not part of the relationship ${this.name}. It has: ${this.connections.map(connection => connection.entity.name).join(", ")}`);
        }
    }

    public toString(): string {
        return this.simpleString();
    }


    simpleString(): string { // TODO: fix this for multi relationships
        let result: string = '';
        const { entity: entityA } = this.connections[0];
        const { entity: entityB } = this.connections[1];

        const multiplicityA = `${this.connections[0].lower_cardinality}..${this.connections[0].upper_cardinality}`;
        const multiplicityB = `${this.connections[1].lower_cardinality}..${this.connections[1].upper_cardinality}`;

        result += `Relationship: ${this.name} between ${entityA.name} (${multiplicityA}) and ${entityB.name} (${multiplicityB})\n`;
        return result
    }
}