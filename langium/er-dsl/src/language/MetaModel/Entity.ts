import {Attribute, DataType, instantiateDataType} from "./Attribute.js";


export type InheritanceType = 'disjoint' | 'overlapping';

export class Entity {
    public name: string;
    public attributes: Attribute[];
    public is_weak: boolean;
    public children: Entity[] = [];
    public inheritanceType: InheritanceType | null = null;
    public nameOfPrimaryKey: string;
    public primaryKey: Attribute;
    public tableName: string;

    constructor(name: string, attributes: Attribute[], is_weak: boolean) {
        this.name = name;
        this.tableName = name;
        this.attributes = attributes;
        this.is_weak = is_weak;

        const pkAttr = this.generatePrimaryKeyIfNotPresent();
        this.nameOfPrimaryKey = pkAttr.name;
        this.primaryKey = pkAttr;
    }

    private generatePrimaryKeyIfNotPresent(): Attribute {
        let pkAttr = this.attributes.find(attribute => attribute.is_primary_key);
        if (!pkAttr) {
            pkAttr = this.attributes.find(attribute => attribute.name.toLowerCase().includes("id"));

            if (!pkAttr) {
                const primaryDataType: DataType = instantiateDataType("serial");
                pkAttr = new Attribute("id", primaryDataType, false, true);
                this.attributes.unshift(pkAttr);
            }else{
                pkAttr.is_primary_key = true;
            }
        }

        return pkAttr;
    }


    public markAsWeak(): void {
        this.is_weak = true;
    }

    public addChild(child: Entity): void {
        this.children.push(child);
    }

    public setInheritanceType(type: InheritanceType): void {
        if (this.hasExplicitInheritance) {
            throw new Error(`Cannot set inheritance type to '${type}' because it is already set to '${this.inheritanceType}'`);
        }
        this.hasExplicitInheritance = true;
        this.inheritanceType = type;
    }

    public getAggregatedInheritanceType(): string{
    let result: string = ""
        if (this.inheritanceType == "disjoint"){
            result = "d";
        }
        if (this.inheritanceType == "overlapping"){
            result = "o";
        }
    return result
    }

    public toString(): string {
        return this.allStringInfo();
        // return this.simpleString();
    }

    private simpleString(): string {

        let result: string = `Entity: ${this.name}\n`;

        for (const attr of this.attributes) {
            result += `  Attribute: ${attr.name} \n`;
        }

        return result
    }

    private allStringInfo(): string {
        let out: string = '';

        const attributeString = "[" + this.attributes.map(attr => attr.toString()).join('; ') + ']';

        out += `Entity: ${this.name} (
            ${this.is_weak ? 'weak' : ''}
            ${this.inheritanceType ? this.inheritanceType : ''}
            ${attributeString}
        )\n`;


        return out;
    }

    // private toPuml(): string {
    //     const indent = '  '.repeat(0);
    //     let result = `${indent}entity ${this.name} {\n`;
    //     for (const attr of this.attributes) {
    //         result += `${indent}  ${attr.name}:\n`;
    //     }
    //     result += `${indent}}\n`;

    //     if (this.parent) {
    //         result += `${indent}${this.name} -|> ${this.parent.name} : extends\n`;
    //         result += this.parent.toPuml();
    //     }

    //     return result;
    // }
}