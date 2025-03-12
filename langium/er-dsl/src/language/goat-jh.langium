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
    (Unique Derived Primary_Foreign Nullable | Unique Derived Nullable Primary_Foreign | Unique Primary_Foreign Derived Nullable | Unique Primary_Foreign Nullable Derived | Unique Nullable Derived Primary_Foreign | Unique Nullable Primary_Foreign Derived |
     Derived Unique Primary_Foreign Nullable | Derived Unique Nullable Primary_Foreign | Derived Primary_Foreign Unique Nullable | Derived Primary_Foreign Nullable Unique | Derived Nullable Unique Primary_Foreign | Derived Nullable Primary_Foreign Unique |
     Primary_Foreign Unique Derived Nullable | Primary_Foreign Unique Nullable Derived | Primary_Foreign Derived Unique Nullable | Primary_Foreign Derived Nullable Unique | Primary_Foreign Nullable Unique Derived | Primary_Foreign Nullable Derived Unique |
     Nullable Unique Derived Primary_Foreign | Nullable Unique Primary_Foreign Derived | Nullable Derived Unique Primary_Foreign | Nullable Derived Primary_Foreign Unique | Nullable Primary_Foreign Unique Derived | Nullable Primary_Foreign Derived Unique)?
    name=ID DataType?;

fragment Unique:
    keywords+=('Unique' | 'unique')?;

fragment Derived:
    keywords+=('Derived' | 'derived')?;

fragment Nullable:
    keywords+=('Nullable' | 'nullable')?;

fragment Primary_Foreign:
    keywords+=KEYWORDSKEYS?;

fragment DataType:
    type=TYPES?;

Relationship:
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


