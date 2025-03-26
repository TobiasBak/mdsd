import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';

import plantumlEncoder from 'plantuml-encoder';

export const setupConfigExtended = (): UserConfig => {
    const extensionFilesOrContents = new Map();
    extensionFilesOrContents.set('/language-configuration.json', new URL('../language-configuration.json', import.meta.url));
    extensionFilesOrContents.set('/goat-jh-grammar.json', new URL('../goat-jh.tmLanguage.json', import.meta.url));

    return {
        wrapperConfig: {
            serviceConfig: defineUserServices(),
            editorAppConfig: {
                $type: 'extended',
                languageId: 'goat-jh',
                code: `// Jakob Hviid Notation for Data Management!\n
Author(PK unique id char(50), lol varchar)
Test(unique idTest char(50), lolTest varchar)
Goated(id)
LOL(id)

Project(name, description, startDate, endDate)
Employee(id, name, address, phone, email, startDate, endDate)

Employee *-* Project : 4 works on


Author *-1 Test : 1 is owned (Goated int)

Author - Goated - LOL, *-*-* : 2 makes gooated (goated int)

Goated 1-1 LOL : 3 contributes to ()

Goated, LOL inherits from Author

Inheritance from Goated is disjointed

Inheritance from Author is overlapping 

Author is identified by 1`,
                useDiffEditor: false,
                extensions: [{
                    config: {
                        name: 'goat-jh-web',
                        publisher: 'generator-langium',
                        version: '1.0.0',
                        engines: {
                            vscode: '*'
                        },
                        contributes: {
                            languages: [{
                                id: 'goat-jh',
                                extensions: [
                                    '.goat-jh'
                                ],
                                configuration: './language-configuration.json'
                            }],
                            grammars: [{
                                language: 'goat-jh',
                                scopeName: 'source.goat-jh',
                                path: './goat-jh-grammar.json'
                            }]
                        }
                    },
                    filesOrContents: extensionFilesOrContents,
                }],                
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.semanticHighlighting.enabled': true,
                        'editor.minimap.enabled': false
                    })
                }
            }
        },
        languageClientConfig: configureWorker()
    };
};

export const executeExtended = async (htmlElement: HTMLElement) => {
    const userConfig = setupConfigExtended();
    const wrapper = new MonacoEditorLanguageClientWrapper();
    await wrapper.initAndStart(userConfig, htmlElement);

    const client = wrapper.getLanguageClient();
    if (!client) {
        throw new Error('Unable to obtain language client for the Minilogo!');
    }

    // PlantUML generation
    client.onNotification('browser/DocumentChange', (resp) => {
        const umltext = resp.content;
        console.log('Received UML text: ', umltext);
        let encoded = plantumlEncoder.encode(umltext);
        const imgUrl = `http://www.plantuml.com/plantuml/img/${encoded}`;
        
        const outputElement = document.getElementById('output-plantuml');
        if (outputElement) {
            outputElement.innerHTML = `<img src="${imgUrl}" alt="PlantUML Image" />`;
        } else {
            console.error('Element with ID "output-plantuml" not found in the DOM.');
        }        
    });

    

};
