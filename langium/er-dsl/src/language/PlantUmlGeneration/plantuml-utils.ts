import { Attribute } from "../MetaModel/Attribute.js";

export function generateKeyword(attribute: Attribute): string {
    let out = ' ';
    console.log(attribute);

    if (attribute.is_primary_key) {
        out += '<<key>> ';
    }
    if (attribute.is_derived) {
        out += '<<derived>> ';
    }

    return out;
}

export function getDataTypeString(attribute: Attribute): string {
    if (attribute.datatype?.value != undefined) {
        return `${attribute.datatype.name} ${attribute.datatype.value}`;
    }
    return `${attribute.datatype?.name}`;
}