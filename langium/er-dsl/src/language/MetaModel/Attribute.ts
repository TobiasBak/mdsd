export class Attribute{
    public name: string;
    public datatype: string; //TODO: enum
    public is_foreign_key: boolean;
    public is_primary_key: boolean;
    public is_unique: boolean;
    public is_nullable: boolean;
    public is_derived: boolean;

    constructor(name: string, datatype: string, // Non-default values
                is_foreign_key: boolean = false, is_primary_key: boolean = false, is_unique: boolean = false,
                is_nullable: boolean = false, is_derived: boolean = false){
        this.name = name;
        this.datatype = datatype;
        this.is_foreign_key = is_foreign_key;
        this.is_primary_key = is_primary_key;
        this.is_unique = is_unique;
        this.is_nullable = is_nullable;
        this.is_derived = is_derived;
    }

    public toString(): string {
        return `${this.name} : ${this.datatype} ${this.is_foreign_key ? 'FK' : ''} ${this.is_primary_key ? 'PK' : ''} ${this.is_unique ? 'U' : ''} ${this.is_nullable ? 'N' : ''} ${this.is_derived ? 'D' : ''}`;
    }
}