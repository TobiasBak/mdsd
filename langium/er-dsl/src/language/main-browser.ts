import { DocumentState, EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';
import { createGoatJhServices } from './goat-jh-module.js';


import { Model } from './generated/ast.js';

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared } = createGoatJhServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);



// Send a notification with the serialized AST after every document change
////type DocumentChange = { uri: string, content: string, diagnostics: Diagnostic[] };
////const documentChangeNotification = new NotificationType<DocumentChange>('browser/DocumentChange');

// use the built-in AST serializer
//const jsonSerializer = MiniLogo.serializer.JsonSerializer;

// listen on fully validated documents
shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, documents => {
    // perform this for every validated document in this build phase batch
    for (const document of documents) {
        const model = document.parseResult.value as Model;
        console.log(model);
        
        // only generate commands if there are no errors
        if(document.diagnostics === undefined 
            || document.diagnostics.filter((i) => i.severity === 1).length === 0
            ) {
            console.log('No errors found, generating commands...'); 
        } else {
            console.log('Errors found, not generating commands...'); 
            console.log(document.diagnostics);
        }
        
        // inject the commands into the model
        // this is safe so long as you careful to not clobber existing properties
        // and is incredibly helpful to enrich the feedback you get from the LS per document
        ////(model as unknown as {$commands: Command[]}).$commands = json;

        // send the notification for this validated document,
        // with the serialized AST + generated commands as the content
        ////connection.sendNotification(documentChangeNotification, {
        ////    uri: document.uri.toString(),
        ////    content: jsonSerializer.serialize(model, { sourceText: true, textRegions: true }),
        ////    diagnostics: document.diagnostics ?? []
        ////});
    }
});