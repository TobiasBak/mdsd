grammar GoatJH

entry Model:
    ( (WS2)(EOL)* |
    relationshipidentifiers+=RelationShipIdentifiers | 
    entities+=Entity | 
    relationship+=Relationship | 
    multirelation+=MultiRelationShip | 
    inheritance+=Inheritance | 
    inheritanceType+=InheritanceType 
    )*;

Entity:
    name=ID '(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')' 
    EOL*
    ;

Attribute:
    A11 | A12 | A13 | A14 | A15 | A16 | A17 | A18 | A19 | A20 | A21 | A22 | A23 | A24 | A25 | A26 | A27 | A28 | A29 | A30 | A31 | A32 | A33 | A34
    ;

fragment A11:
    T1 T2 T3 T4 name=ID T5;

fragment A12:
    T2 T1 T3 T4 name=ID T5;

fragment A13:
    T1 T3 T2 T4 name=ID T5;

fragment A14:
    T3 T1 T2 T4 name=ID T5;

fragment A15:
    T2 T3 T1 T4 name=ID T5;

fragment A16:
    T3 T2 T1 T4 name=ID T5;

fragment A17:
    T4 T1 T2 T3 name=ID T5;

fragment A18:
    T1 T4 T2 T3 name=ID T5;

fragment A19:
    T2 T4 T1 T3 name=ID T5;

fragment A20:
    T4 T2 T1 T3 name=ID T5;

fragment A21:
    T1 T2 T4 T3 name=ID T5;

fragment A22:
    T2 T1 T4 T3 name=ID T5;

fragment A23:
    T3 T4 T1 T2 name=ID T5;

fragment A24:
    T4 T3 T1 T2 name=ID T5;

fragment A25:
    T4 T1 T3 T2 name=ID T5;

fragment A26:
    T1 T4 T3 T2 name=ID T5;

fragment A27:
    T3 T1 T4 T2 name=ID T5;

fragment A28:
    T1 T3 T4 T2 name=ID T5;

fragment A29:
    T2 T3 T4 T1 name=ID T5;

fragment A30:
    T3 T2 T4 T1 name=ID T5;

fragment A31:
    T2 T4 T3 T1 name=ID T5;

fragment A32:
    T4 T2 T3 T1 name=ID T5;

fragment A33:
    T4 T3 T2 T1 name=ID T5;

fragment A34:
    T3 T4 T2 T1 name=ID T5;


fragment T1:
    keywords+=('Unique' | 'unique')?;

fragment T2:
    keywords+=('Derived' | 'derived')?;

fragment T4:
    keywords+=('Nullable' | 'nullable')?;

fragment T3:
    keywords+=KEYWORDSKEYS?;

fragment T5:
    type=TYPES?;

Relationship:
// Wo do entity=ID instead of entity=[Entity] becayse we want to overwrite
// and reference entities not defined yet.
    entities+=[Entity:ID]               
    cardinality+=(RANGE_PATTERN | INT)  '-' cardinality+=(RANGE_PATTERN | INT)  
    entities+=[Entity:ID]
    ':' 
    // The ('is' | 'from') is needed for their lexer to allow keywords to be here
    // The content shows a red line, but that is only visual. The object contains the "is"
    // I tried replacing ('is' | 'from') with a terminal definition, but did not work
    name=(INT)
    string_array+=(ID | ('is' | 'from'))+ 
    ('(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')' )?
    EOL*
    ;

MultiRelationShip:
    entities+=[Entity:ID] (('-') entities+=[Entity:ID])*
    ','
    cardinality+=(RANGE_PATTERN | INT)  '-' cardinality+=(RANGE_PATTERN | INT) '-' cardinality+=(RANGE_PATTERN | INT) (('-') cardinality+=(RANGE_PATTERN | INT))*
    ':'
    name=INT
    (string_array+=ID+) 
    ('(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')')?
    EOL*
    ;

Inheritance: 
    children+=[Entity:ID] (',' children+=[Entity:ID])*
    'inherits' 'from'
    parent=[Entity:ID]
    EOL*
    ;

InheritanceType:
    'Inheritance' 'from' entity=[Entity:ID] 'is' (type='overlapping' | type='disjointed')
    EOL*
    ;

RelationShipIdentifiers:
    entity=[Entity:ID] 'is''identified' 'by' identifier=[Relationship:INT]
    EOL*
    ;

// MAKE TERMINALS GO IN ORDER OF HOW SPECIFIC THEY ARE. 
// THEREFORE ID SHOULD BE THE LAST MATCH TO BE CHEKCED
terminal KEYWORDSKEYS: 'PK' | 'FK';
terminal TYPES: "bigint" | "boolean" | "bool" | "char(" INT ")" | "char" | "varchar(" INT ")" | "varchar" | "date" | "int" | "real" | "smallint" | "text" | "uuid" | "time" | "timestamp" | "float";



terminal RANGE_PATTERN: 
    ('*' | INT '..' INT | INT '..' '*');

terminal INT: ('0'..'9')+;


terminal EOL: /\r?\n/;

terminal WS2: /\s+/;
hidden terminal WS: /[ \t]+/;

terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

//hidden terminal NL: /[\r\n]+/;


