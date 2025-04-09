import {Entity} from "../MetaModel/Entity.js";

export function generateForeignKeyToEntity(entity: Entity, extraname: string, nullable: boolean = false): string {
    let output = `${extraname}_${entity.tableName}_${entity.getPrimaryKey().name} ${entity.getPrimaryKey().getSqlRepresentationOfDataType(true)} REFERENCES ${entity.tableName}(${entity.getPrimaryKey().name})`

    if (!nullable) {
        output += " NOT NULL";
    }

    return output;
}
