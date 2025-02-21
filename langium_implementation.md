
# Todo based on syntax missing
[x] Declaring entity    
[ ] Declaring Relationship
    [x] Terminal command for defining \*-\* / 1..2-1 / etc.
    [ ] I am unsure if the range pattern is correct. 
[ ] Deciding if string_array is a good enough substitute for multiple word strings
[X] Inheritance
[ ] MultiRelationships have no way to confirm that amount of entities relates to amount of relationships specified
    [ ] Have no way to confirm that amount of entities relates to amount of relationships specified
        [ ] I do no know if this is possible. 
    [ ] Potentially should change relationships (\*-\*) to be as array instead of current implementation so backend does not have to do string.split xd
 
### [Issue with using keywords as text](https://langium.org/docs/recipes/keywords-as-identifiers/)
### [Building a webbrowser with langium ](https://langium.org/docs/learn/minilogo/generation_in_the_web/)


### Cooked rules found out during implementation
1. Order of terminal commands matter. If ID is defined before in example KEYWORDS, then strings will be matched with ID and not as KEYWORDS, so it will not work.


# Implemented syntax
```langium
grammar MiniLogo

entry Model:
    (entities+=Entity | relationship+=Relationship | multirelation+=MultiRelationShip | inheritance+=Inheritance | inheritanceType+=InheritanceType)*;

Entity:
    name=ID '(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')';

Attribute:
    // Match for any amount of optional keywords, then find a name, 
    // and then any amount of optional keywors
    (keywords+=KEYWORDS)* (name=ID) (keywords+=KEYWORDS)*
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
    ('(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')')?
    ;

MultiRelationShip:
    entities+=ID (('-') entities+=ID)*
    ','
    relation=REL_RANGE_MULTI
    ':'
        (identifier_as_string_array+=ID+) 
    ('(' (attributes+=Attribute (',' attributes+=Attribute)*)? ')')?
    ;

Inheritance: 
    children+=ID (',' children+=ID)*
    'inherents' 'from'
    parent=ID
    ;

InheritanceType:
    'Inheritance' 'from' entity=ID 'is' (type='overlapping' | type='disjointed')
    ;


// MAKE TERMINALS GO IN ORDER OF HOW SPECIFIC THEY ARE. 
// THEREFORE ID SHOULD BE THE LAST MATCH TO BE CHEKCED
terminal KEYWORDS:
    ('PK' | 'FK' | 'string' | 'number');

terminal REL_RANGE_MULTI:
    RANGE_PATTERN '-' RANGE_PATTERN '-' RANGE_PATTERN (('-') RANGE_PATTERN)*;


// Regex matching Jakob-hviid notation for relationship ranges
// Unsure if this is 100% correct
terminal RANGE_PATTERN: 
    ('*' | ('0'..'9')+ '..' ('0'..'9')+ | ('0'..'9')+ '..' '*' | ('0'..'9')+);
terminal REL_RANGE:
    RANGE_PATTERN '-' (RANGE_PATTERN);

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
```

## Content used
```
Author(id number string, lol)

Author *-* Test : is owned (Goated number)

Author - Goated - LOL, *-*-* : makes gooated (goated number)

Goated, LOL inherents from Author

Inheritance from Goated is disjointed

Inheritance from Author is overlapping 
```