export type DataTypeName = "bigint" | "boolean" | "bool" | "char" | "varchar" | "date" | "int" | "real" | "smallint" | "text" | "uuid" | "time" | "timestamp" | "float" | "serial";

export type DataType = {
    name: DataTypeName;
    value: number | undefined;
}

export function instantiateDataType(name: DataTypeName, value: number | undefined = undefined): DataType {
    return {name, value};
}

export class Attribute{
    public name: string;
    public datatype: DataType | undefined;
    public is_foreign_key: boolean;
    public is_primary_key: boolean;
    public is_unique: boolean;
    public is_nullable: boolean;
    public is_derived: boolean;

    constructor(name: string, datatype: DataType |undefined, // Non-default values
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

    public getSqlRepresentationOfDataType(forForeignKey: boolean = false): string {
        let datatype = this.datatype ? this.datatype.name : '<X>';
        datatype = datatype.toUpperCase();

        if (forForeignKey && datatype == "SERIAL") {
            return "INT";
        }

        if (this.datatype && this.datatype.value) {
            datatype += `(${this.datatype.value})`;
        }
        return datatype;
    }

    public toString(): string {
        return this.allStringInfo();
    }

    public allStringInfo(): string {
        return `${this.name} (
            ${this.datatype ? this.datatype.name : ''}
            ${this.is_foreign_key ? 'FK' : ''}
            ${this.is_primary_key ? 'PK' : ''}
            ${this.is_unique ? 'U' : ''}
            ${this.is_nullable ? 'N' : ''}
            ${this.is_derived ? 'D' : ''}
        )\n`;
    }
}