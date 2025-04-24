import {Attribute} from "./Attribute.js";
import {Entity} from "./Entity.js";
import {generateForeignKeyToEntity} from "../SQL/SQLHelper.js";

export class ForeignPKAttribute extends Attribute {
    private _foreignEntity: Entity;

    constructor(fromEntity: Entity) {
        const foreginPK = fromEntity.getPrimaryKey();
        super(foreginPK.name, foreginPK.datatype, true, true, true, false, false);
        this._foreignEntity = fromEntity;
    }

    toSQLString(): string {
        let fkString = generateForeignKeyToEntity(this._foreignEntity, this._foreignEntity.tableName);
        fkString += ` PRIMARY KEY`;
        return fkString;
    }
}