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

    public hasSideWithSingularCardinality(exact: boolean = true): boolean {

        return cardinalityIsSingular(this.side_a.lower_cardinality, exact) && cardinalityIsSingular(this.side_a.upper_cardinality, exact) ||
            cardinalityIsSingular(this.side_b.lower_cardinality, exact) && cardinalityIsSingular(this.side_b.upper_cardinality, exact);
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

/**
 * Returns true if the cardinality is singular. If strict is true, it will only return true if the cardinality is exactly 1.
 * When strict is false, it will return true if the cardinality is 0 or 1.
 * @param cardinality The input cardinality to check
 * @param strict If true, the cardinality must be exactly 1 to return true
 */
export function cardinalityIsSingular(cardinality: Cardinality, strict: boolean = true): boolean {
    if(strict){
        return cardinality == 1;
    }
    if (cardinality == "*"){
        return false;
    }
    return cardinality <= 1;
}