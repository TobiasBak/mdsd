import {Attribute} from "./Attribute.js";

export class RelationshipAttribute extends Attribute {
    constructor(name: string, datatype: string, // Non-default values
                is_unique: boolean = false, is_nullable: boolean = false, is_derived: boolean = false) {
        super(name, datatype, false, false, is_unique, is_nullable, is_derived);
    }

    public toString(): string {
        return `${this.name} : ${this.datatype} ${this.is_unique ? 'U' : ''} ${this.is_nullable ? 'N' : ''} ${this.is_derived ? 'D' : ''}`;
    }
}