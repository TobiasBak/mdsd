import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';

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
                code: `// Jakob Hviid Notation for Data Management!\nentity(PK name string)\nentity2(PK id string, FK Derived name string)\n\nentity *-* entity2 : owns (date string)\n\nentity2 inherents from person\nInheritance from person is disjointed`,
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
};
