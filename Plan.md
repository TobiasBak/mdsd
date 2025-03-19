```mermaid
kanban
    column1[TODO]
        task9[Validation + syntaxttingeling efter senere lectures]@{assigned: Noone}
        task7[**Requirements:** Create a left recursion problem and solve it]@{assigned: Noone}
    column2[Underway]
        task5[**Generation:** Generating the plantuml files to feed the plantuml live server]@{assigned: RASSERN}
        task6[**Generation:** Generate SQL code in a .sql file]@{assigned: THOR}
        task1[**Webserver:** Simple frontend, with editable textarea saved in a .JH file]@{assigned: Kevin & Tobib}
        task8[**Webserver:** Forwarding error messages in syntax to frontend?]@{assigned: Kevin & Tobib}
        task2[**Webserver:** Possibly getting syntax + highlighting like vscode?]@{assigned: Kevin & Tobib}
    column3[PR]
    column4[Done]
        task3[**Plantuml:** Liveserver, where we can send file to and recieve a png of the diagram]@{assigned: Kevin & Tobib}
        task4[**Generation:** Creating OOP structure of Entities, relations, etc in the generation.ts file]@{assigned: THOR & RASSERN}



```

## Added features
- Validator to ensure entities have a singular parent.

## Housekeeping
Before we are done we should change the option `noUnusedLocals` back to `true` in `tsconfig.json`.

## More types
We need to support serial in the language as well