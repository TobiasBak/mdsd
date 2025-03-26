import { DocumentState, EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection, NotificationType, Diagnostic } from 'vscode-languageserver/browser.js';
import { createGoatJhServices } from './goat-jh-module.js';

import { Model } from './generated/ast.js';
import { instantiateMetaModelFromLangiumModel } from './MetaModel/Instantiator.js';
import { generateUMLDiagram } from './PlantUmlGeneration/generate-plantuml.js';
import {generateSQLFile} from "./SQL/SQLGenerator.js";

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared } = createGoatJhServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);

type DocumentChange = { uri: string, content: string, diagnostics: Diagnostic[] };
const documentChangeNotification = new NotificationType<DocumentChange>('browser/DocumentChange');


// listen on fully validated documents
shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, documents => {
    // perform this for every validated document in this build phase batch
    for (const document of documents) {
        const model = document.parseResult.value as Model;
        
        // only generate commands if there are no errors
        if(document.diagnostics === undefined 
            || document.diagnostics.filter((i) => i.severity === 1).length === 0
            ) {
            console.log('No errors found, generating commands...');
            const sql = generateSQLFile(instantiateMetaModelFromLangiumModel(model));
            console.log("Generated sql:",sql)

            console.log('No errors found, generating commands...'); 
            const outModel = instantiateMetaModelFromLangiumModel(model);
            const umlText = generateUMLDiagram(outModel);
            
            // Send notification with umlText
            connection.sendNotification(documentChangeNotification, {
                uri: document.uri.toString(),
                content: umlText,
                diagnostics: document.diagnostics ?? []
            });
            
        } else {
            console.log('Errors found, not generating commands...'); 
            console.log(document.diagnostics);
        } 
    }
});