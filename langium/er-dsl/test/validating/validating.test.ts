import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import { createGoatJhServices } from "../../src/language/goat-jh-module.js";
import { Model, isModel } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createGoatJhServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    services = createGoatJhServices(EmptyFileSystem);
    const doParse = parseHelper<Model>(services.GoatJh);
    parse = (input: string) => doParse(input, { validation: true });

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Validating', () => {
  
    test('check no errors', async () => {
        document = await parse(`
Student(unique exam_number int)
Professor(position)

Student, Professor inherits from Adult
Inheritance from Adult is disjointed

Course(PK id, name varchar, ETCS int, year int, start date, end date, room varchar(5))
Course 1-* Student: 1 enrolls(role varchar)
Course 1-1..2 Professor: 2 teaches

External_Course(cost float)
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
Parent(children boolean)
Kid(favorite_toy varchar)
Adult(rights boolean)

Parent 1-* Kid : 6 parent_of
Kid is identified by 6

Kid, Parent, Adult inherits from Human
Inheritance from Human is overlapping

A()
B()
C()

C, A inherits from B
Inheritance from B is disjointed        
`);
        expect(
            // here we first check for validity of the parsed document object by means of the reusable function
            //  'checkDocumentValid()' to sort out (critical) typos first,
            // and then evaluate the diagnostics by converting them into human readable strings;
            // note that 'toHaveLength()' works for arrays and strings alike ;-)
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);
    });

    test('check circular inheritance', async () => {
        document = await parse(`
            A()
            B()
            C()
            D()
            E()
            
            B, C inherits from A
            D inherits from B
            E inherits from D
            A inherits from E 
            Inheritance from A is disjointed
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining(s`
                Circular inheritance detected: A -> E -> D -> B -> A
            `)
        );
    });
    test('check inheritancetype requirement', async () => {
        document = await parse(`
            A()
            B()
            C()
            
            C, A inherits from B
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining(s`
                The type of inheritance from an entity must be specified if the entity has more than one child.
            `)
        );
    });
    test('check inheritancetype not allowed for singular inheritance', async () => {
        document = await parse(`
            A()
            B()
            C()
            
            C inherits from B
            Inheritance from B is disjointed
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining(s`
                The type of inheritance from an entity must not be specified if the entity has only one child.
            `)
        );
    });
    test('check inheritancetype not allowed for singular inheritance (overlapping)', async () => {
        document = await parse(`
            A()
            B()
            C()
            
            C inherits from B
            Inheritance from B is overlapping
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining(s`
                The type of inheritance from an entity must not be specified if the entity has only one child.
            `)
        );
    });
    test('check inheritancetype is only specified once', async () => {
        document = await parse(`
            A()
            B()
            C()
            
            Inheritance from B is overlapping
            C, A inherits from B
            Inheritance from B is disjointed
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining(s`
                The type of inheritance from an entity cannot be specified twice.
            `)
        );
    });

    test('check children have unique attributes', async () => {
        document = await parse(`
            A(pk id, name)
            B()
            C(id)
            D(name)
            
            B inherits from A
            C, D inherits from B
            Inheritance from B is disjointed
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining(s`
                Duplicate attribute name. Conflicts with parent: A
            `)
        );
    });
    test('check siblings can have same attributes', async () => {
        document = await parse(`
            A()
            B()
            C(id)
            D(id)
            
            B inherits from A
            C, D inherits from B
            Inheritance from B is disjointed
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isModel(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Model}'.`
        || undefined;
}

function diagnosticToString(d: Diagnostic) {
    return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}
