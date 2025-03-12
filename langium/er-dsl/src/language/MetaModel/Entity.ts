import {Attribute} from "./Attribute.js";


export type InheritanceType = 'disjoint' | 'overlapping';

export class Entity{
    public name: string;
    public attributes: Attribute[];
    public is_weak: boolean;
    public parent: Entity | null = null;
    public inheritanceType: InheritanceType | null = null;

    constructor(name: string, attributes: Attribute[], is_weak: boolean){
        this.name = name;
        this.attributes = attributes;
        this.is_weak = is_weak;
    }

    public toString(): string {
        return `${this.name} ${this.is_weak ? 'W' : ''}`;
    }
}