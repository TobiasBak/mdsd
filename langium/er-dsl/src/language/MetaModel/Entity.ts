import {Attribute, DataType, instantiateDataType} from "./Attribute.js";
import {ForeignPKAttribute} from "./ForeignPKAttribute.js";


export type InheritanceType = 'disjoint' | 'overlapping';

export class Entity {
    public name: string;
    public attributes: Attribute[];
    public is_weak: boolean;
    public children: Entity[] = [];
    public inheritanceType: InheritanceType | null = null;
    private primaryKey: Attribute | null = null;
    public tableName: string;

    public parent: Entity | null = null;

    constructor(name: string, attributes: Attribute[], is_weak: boolean) {
        this.name = name;
        this.tableName = name;
        this.attributes = attributes;
        this.is_weak = is_weak;
    }

    public setParent(parent: Entity): void {
        this.parent = parent;
        this.primaryKey = this.generatePrimaryKeyIfNotPresent();
    }

    public getPrimaryKey(): Attribute {
        if (this.primaryKey == null) {
            this.primaryKey = this.generatePrimaryKeyIfNotPresent();
        }
        if (this.primaryKey == null) {
            throw new Error(`Primary key is still null after generation: Entity ${this}`);
        }

        return this.primaryKey;
    }

    private generatePrimaryKeyIfNotPresent(): Attribute {
        if (this.parent != null) {
            const pkAttr = new ForeignPKAttribute(this.parent);
            this.attributes.unshift(pkAttr);
            return pkAttr;
        }

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
        if (this.inheritanceType != null) {
            throw new Error(`Cannot set inheritance type to '${type}' because it is already set to '${this.inheritanceType}'`);
        }
        this.inheritanceType = type;
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

        out += `Entity: ${this.name} (` +
            `${this.is_weak ? 'weak ' : ''}` +
            `${this.inheritanceType ? this.inheritanceType + " " : ''}` +
            `${attributeString}` +
            `)`;


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