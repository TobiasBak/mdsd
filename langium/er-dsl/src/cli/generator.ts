import type { Model } from '../language/generated/ast.js';
import { expandToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';
import {convertModelToString} from "../language/MetaModel/convertModelToString.js";
import {generateSQLFile} from "../language/SQL/SQLGenerator.js";
import {instantiateMetaModelFromLangiumModel} from "../language/MetaModel/Instantiator.js";

export function generateDiagram(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.SQL`;

    const fileNode = expandToNode`
        ${generateSQLFile(instantiateMetaModelFromLangiumModel(model))}
    `.appendNewLineIfNotEmpty();

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}
