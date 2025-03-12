import { Attribute } from "./Attribute.js";


export type InheritanceType = 'disjoint' | 'overlapping';

export class Entity {
    public name: string;
    public attributes: Attribute[];
    public is_weak: boolean;
    public parent: Entity | null = null;
    public inheritanceType: InheritanceType | null = null;

    constructor(name: string, attributes: Attribute[], is_weak: boolean) {
        this.name = name;
        this.attributes = attributes;
        this.is_weak = is_weak;
    }


    public markAsWeak(): void {
        this.is_weak = true;
    }

    public toString(): string {
        return this.simpleString();
    }

    private simpleString(): string {

        let result: string = `Entity: ${this.name}\n`;

        for (const attr of this.attributes) {
            result += `  Attribute: ${attr.name} \n`;
        }

        return result
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