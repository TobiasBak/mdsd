import {MultiRelationship, RelationshipConnection, side, Cardinality} from "./MultiRelationship.js";
import {RelationshipAttribute} from "./RelationshipAttribute.js";

export class Relationship extends MultiRelationship {
    public side_a: RelationshipConnection;
    public side_b: RelationshipConnection;

    constructor(name: string, identifier: number, side_a: RelationshipConnection, side_b: RelationshipConnection, attributes: RelationshipAttribute[], is_weak: boolean = false) {
        super(name, identifier, [side_a, side_b], attributes, is_weak);
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

    public toPlantUMLWithAttribute(
        getDataTypeString: (attribute: RelationshipAttribute) => string,
        generateKeyword: (attribute: RelationshipAttribute) => string
    ): string {
        let result: string = "";
        result = `relationship "${this.name}" as ${this.name} ${this.is_weak ? "<<identifying>>" : ""} {
            ${this.attributes.map((attribute) => {
                return `${attribute.name} : ${getDataTypeString(attribute)} ${generateKeyword(attribute)}`;
            }).join('\n')}
        }`;

        return result;
    }

    public toPlantUMLCardinality(): string {
        let sideA = `${this.name} -${getCardinality(this.side_a)}- ${this.side_a.entity.name}`;
        let sideB = `${this.name} -${getCardinality(this.side_b)}- ${this.side_b.entity.name}`;
        return `${sideA}\n${sideB}`;
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

function getCardinality(side: RelationshipConnection): string {
    if (side.lower_cardinality == side.upper_cardinality){
        return `${convertAsteriskToN(side.lower_cardinality)}`;
    }else {
        return `(${convertAsteriskToN(side.lower_cardinality)},${convertAsteriskToN(side.upper_cardinality)})`;
    }
}

function convertAsteriskToN(cardinality: number | "*"): string | number {
    if (cardinality == "*"){
        return "n";
    }
    return cardinality;
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