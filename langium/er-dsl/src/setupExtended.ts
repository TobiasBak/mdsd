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
                code: `// Jakob Hviid Notation for Data Management!\nentity(PK name varchar)\nentity2(PK id varchar, FK Derived name varchar(255))\n\nentity *-* entity2 : 1 owns (slot date)\n\nentity2 inherits from person\nInheritance from person is disjointed`,
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
