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

// The attribute must have all different permutations of the keywords to allow for arbitrary ordering.
// Since each fragment allows for the keyword to be optional, we do not need to specify all permutations with no keyword.
Attribute:
    keywords+=(KEYWORDS)* name=ID type=TYPES?;

Relationship:
    entities+=[Entity:ID]               
    cardinality+=(RANGE_PATTERN | INT | '*')  '-' cardinality+=(RANGE_PATTERN | INT | '*')  
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
    cardinality+=(RANGE_PATTERN | INT | '*')  '-' cardinality+=(RANGE_PATTERN | INT | '*') '-' cardinality+=(RANGE_PATTERN | INT | '*') (('-') cardinality+=(RANGE_PATTERN | INT | '*'))*
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
    entity=[Entity:ID] 'is''identified' 'by' identifier=INT
    EOL*
    ;

// Left recursion
Expression: Addition;

Addition infers Expression:
    Multiplication ({infer Addition.left=current} operator=('+' | '-') right=Multiplication)*;

Multiplication infers Expression:
    Exponent ({infer Multiplication.left=current} operator=('*' | '/') right=Exponent)*;

Exponent infers Expression:
    Primary ({infer Exponent.left=current} operator=('^') right=Primary)* |
    'sqrt''(' ({infer Unary} expression=Addition) ')' |
    Primary;

Primary infers Expression:
    '(' Addition ')'|
    ({infer Integer}value=INT);    

TYPES: (type="char" "(" value=Expression ")")? | (type="varchar" "(" value=Expression ")")? | type=("bigint" | "boolean" | "bool" | "char" | "varchar" | "date" | "int" | "real" | "smallint" | "text" | "uuid" | "time" | "timestamp" | "float")?;


// MAKE TERMINALS GO IN ORDER OF HOW SPECIFIC THEY ARE. 
// THEREFORE ID SHOULD BE THE LAST MATCH TO BE CHEKCED
terminal KEYWORDS: 'PK' | 'pk' | 'FK' | 'fk' | 'Nullable' | 'nullable' | 'Derived' | 'derived' | 'Unique' | 'unique';

terminal RANGE_PATTERN: 
    (INT '..' INT | INT '..' '*');

terminal INT returns number: ('0'..'9')+;
//terminal TYPES: "bigint" | "boolean" | "bool" | "char(" INT ")" | "char" | "varchar(" INT ")" | "varchar" | "date" | "int" | "real" | "smallint" | "text" | "uuid" | "time" | "timestamp" | "float";



terminal EOL: /\r?\n/;

terminal WS2: /\s+/;
hidden terminal WS: /[ \t]+/;

terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

//hidden terminal NL: /[\r\n]+/;