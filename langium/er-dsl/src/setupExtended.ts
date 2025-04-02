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
                code: `// Jakob Hviid Notation for Data Management!
Student(PK id, unique exam_number int)
Professor(PK id)

Student, Professor inherits from Adult
Inheritance from Adult is disjointed

Course(PK id, name varchar, ETCS int, year int, start date, end date, room varchar(5))
Course 1-* Student: 1 enrolls(role varchar)
Course 1-1..2 Professor: 2 teaches

External_Course(PK id, cost float)
External_Course inherits from Course
External_Course 1-* Human: 3 takes
External_Course 1-1..2 Professor: 4 teaches

// Multirelationship
Supplier(PK id, name varchar)
Project(PK id, name varchar)
Part(PK id)
Supplier-Part-Project, 1-1-* : 5 Supply (Quantity int)

// Adding Human + kids
Human(PK id, name varchar(20+20+40), birth_date date, derived age int, address varchar, zipcode int)
Parent(PK id, children boolean)
Kid(PK id, favorite_toy varchar)
Adult(PK id, rights boolean)

Parent 1-* Kid : 6 parent_of
Kid is identified by 6

Kid, Parent, Adult inherits from Human
Inheritance from Human is overlapping
`,
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
        const imgUrl = `http://plantuml.thorj.dk/img/${encoded}`;
        
        const outputElement = document.getElementById('output-plantuml');
        if (outputElement) {
            outputElement.innerHTML = `<img src="${imgUrl}" alt="PlantUML Image" />`;
        } else {
            console.error('Element with ID "output-plantuml" not found in the DOM.');
        }        
    });

    

};
