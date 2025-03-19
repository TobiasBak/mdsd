import {MultiRelationship, RelationshipConnection, side, Cardinality} from "./MultiRelationship.js";
import {RelationshipAttribute} from "./RelationshipAttribute.js";

export class Relationship extends MultiRelationship {
    public side_a: RelationshipConnection;
    public side_b: RelationshipConnection;

    constructor(name: string, side_a: RelationshipConnection, side_b: RelationshipConnection, attributes: RelationshipAttribute[], is_weak: boolean = false) {
        super(name, [side_a, side_b], attributes, is_weak);
        this.side_a = side_a;
        this.side_b = side_b;
    }

    public hasRangedCardinality(side: side): boolean {
        if (side == "a"){
            return this.side_a.lower_cardinality != this.side_a.upper_cardinality;
        }else if (side == "b"){
            return this.side_b.lower_cardinality != this.side_b.upper_cardinality;
        }
        throw Error("Wrong side argument provided: " + side);
    }

    public override toString(): string {
        return this.simpleString();
    }

    override simpleString(): string {
        let result: string = '';
        const { entity: entityA } = this.side_a;
        const { entity: entityB } = this.side_b;

        const multiplicityA = `${this.side_a.lower_cardinality}..${this.side_a.upper_cardinality}`;
        const multiplicityB = `${this.side_b.lower_cardinality}..${this.side_b.upper_cardinality}`;

        result += `Relationship: ${this.name} between ${entityA.name} (${multiplicityA}) and ${entityB.name} (${multiplicityB})\n`;
        return result
    }
}