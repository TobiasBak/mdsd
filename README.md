# README
Project for the course in Domain Specific Languages.

## PREREQUISITES
Some high version of node, tobias is using V23.8.0.

Open the `er-dsl` folder in vscode.

Run `npm install` in this folder.

You do not need the extensions that are recommended in the project.

## HOW TO USE LANGIUM
If you have edited the grammar in `langium/er-dsl/src/language/goat-jh.langium` 
Then you need to run `npm run langium:generate` for it to update.

If you want to test a grammar, then you can run and debug a .JH file in vscode.
This requires that you create a file in the new editor. It does not automatically use the file that has been opened with debug.

If you want to run a .JH file you can run `node langium/er-dsl/bin/cli.js generate ../test.JH`

