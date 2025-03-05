grammar GoatJH

entry Model:
    (relationshipidentifiers+=RelationShipIdentifiers | entities+=Entity | relationship+=Relationship | multirelation+=MultiRelationShip | inheritance+=Inheritance | inheritanceType+=InheritanceType )*;

Entity:
    name=ID '(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')' 
    EOL*
    ;

Attribute:
    // Match for any amount of optional keywords, then find a name, 
    // and then any amount of optional keywors
    keywords+=KEYWORDSKEYS? keywords+='Unique'? keywords+='Derived'? name=ID type=TYPES?
    ;

Relationship:
// Wo do entity=ID instead of entity=[Entity] becayse we want to overwrite
// and reference entities not defined yet.
    entities+=ID                
    (relationship=REL_RANGE)   
    entities+=ID 
    ':' 
    // The ('is' | 'from') is needed for their lexer to allow keywords to be here
    // The content shows a red line, but that is only visual. The object contains the "is"
    // I tried replacing ('is' | 'from') with a terminal definition, but did not work
    identifier_as_string_array+=(ID | ('is' | 'from'))+ 
    ('(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')' )?
    EOL*
    ;

MultiRelationShip:
    entities+=ID (('-') entities+=ID)*
    ','
    relation=REL_RANGE_MULTI
    ':'
        (identifier_as_string_array+=ID+) 
    ('(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')')?
    EOL*
    ;

Inheritance: 
    children+=ID (',' children+=ID)*
    'inherents' 'from'
    parent=ID
    EOL*
    ;

InheritanceType:
    'Inheritance' 'from' entity=ID 'is' (type='overlapping' | type='disjointed')
    EOL*
    ;

RelationShipIdentifiers:
    entity=ID 'is''identified' 'by' identifier+=(ID | ('is' | 'from'))+
    EOL*
    ;

// MAKE TERMINALS GO IN ORDER OF HOW SPECIFIC THEY ARE. 
// THEREFORE ID SHOULD BE THE LAST MATCH TO BE CHEKCED
terminal KEYWORDSKEYS: 'PK' | 'FK';

terminal TYPES: 'string' | 'number';

terminal REL_RANGE_MULTI:
    RANGE_PATTERN '-' RANGE_PATTERN '-' RANGE_PATTERN (('-') RANGE_PATTERN)*;


// Regex matching Jakob-hviid notation for relationship ranges
// Unsure if this is 100% correct
terminal RANGE_PATTERN: 
    ('*' | ('0'..'9')+ '..' ('0'..'9')+ | ('0'..'9')+ '..' '*' | ('0'..'9')+);
terminal REL_RANGE:
    RANGE_PATTERN '-' (RANGE_PATTERN);

terminal EOL: /\r?\n/;

hidden terminal WS: /[ \t]+/;
terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

//hidden terminal NL: /[\r\n]+/;