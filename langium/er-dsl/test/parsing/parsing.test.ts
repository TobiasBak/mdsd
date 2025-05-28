import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { createGoatJhServices } from "../../src/language/goat-jh-module.js";
import { Model, isModel } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createGoatJhServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    services = createGoatJhServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.GoatJh);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Parsing tests', () => {
    test('parse Entities', async () => {
        document = await parse(`
Student(PK id, unique exam_number int)
Professor(PK id)
Course(PK id, name varchar, ETCS int, year int, start date, derived end date, room varchar(5))
External_Course(FK id, nullable cost float)
A(pk nullable derived unique superattr int)
        `);

        expect(
            checkDocumentValid(document) || s`
                Entities:
                    ${document.parseResult.value?.entities?.map(e => e.name)?.join('\n')}
                Student attributes:
                    ${document.parseResult.value?.entities?.find(e => e.name === 'Student')?.attributes?.map(a => a.name)?.join('\n')}
                Professor attributes:
                    ${document.parseResult.value?.entities?.find(e => e.name === 'Professor')?.attributes?.map(a => a.name)?.join('\n')}
                Course attributes:
                    ${document.parseResult.value?.entities?.find(e => e.name === 'Course')?.attributes?.map(a => a.name)?.join('\n')}
                External_Course attributes:
                    ${document.parseResult.value?.entities?.find(e => e.name === 'External_Course')?.attributes?.map(a => a.name)?.join('\n')}
                A attributes:
                    ${document.parseResult.value?.entities?.find(e => e.name === 'A')?.attributes?.map(a => a.name)?.join('\n')}                
            `
        ).toBe(s`
            Entities:
                Student
                Professor
                Course
                External_Course
                A
            Student attributes:
                id
                exam_number
            Professor attributes:
                id
            Course attributes:
                id
                name
                ETCS
                year
                start
                end
                room
            External_Course attributes:
                id
                cost
            A attributes:
                superattr
        `);
    });

    test('parse full model', async () => {
        document = await parse(`
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

Human inherits from Student

A()
B()
C()

C, A inherits from B
B inherits from A

Inheritance from B is disjointed
        `);

        expect(
            // here we use a (tagged) template expression to create a human readable representation
            //  of the AST part we are interested in and that is to be compared to our expectation;
            // prior to the tagged template expression we check for validity of the parsed document object
            //  by means of the reusable function 'checkDocumentValid()' to sort out (critical) typos first;
            checkDocumentValid(document) || s`
                Relationships:
                    ${document.parseResult.value?.relationship?.map(p => p.string_array)?.join('\n')}
                Multirelationships:
                    ${document.parseResult.value?.multirelation?.map(g => g.string_array)?.join('\n')}
                Parents:
                    ${document.parseResult.value?.inheritance?.map(e => e.parent.ref?.name).join('\n')}
                Children:
                    ${document.parseResult.value?.inheritance?.map(e => e.children.map(c => c.ref?.name).join('\n')).join('\n')}
                InheritanceTypes:
                    ${document.parseResult.value?.inheritanceType?.map(e => e.entity.ref?.name + " " + e.type).join('\n')}
            `
        ).toBe(s`
            Relationships:
                enrolls
                teaches
                takes
                teaches
                parent_of
            Multirelationships:
                Supply
            Parents:
                Adult
                Course
                Human
                Student
                B
                A                
            Children:
                Student
                Professor
                External_Course
                Kid
                Parent
                Adult
                Human
                C
                A
                B
            InheritanceTypes:
                Adult disjointed
                Human overlapping
                B disjointed
            `);
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isModel(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Model}'.`
        || undefined;
}
