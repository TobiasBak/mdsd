

## Usecase

Using shorthand notation to quickly generate a starting point for an entity-relation diagram.

### Advantages: 
- Will include:
    1. Syntax for PK & FK
    2. Custom syntax for partial keys (more complex to parse)
    3. Derived attributes
    4. Everything else available in an ER-diagram except
        1. Multi-value attributes
        2. Compound attributes (Instead, use a relation to a entity, which has attributes instead)
- More human language used to generate ER-diagrams
 

### Disadvantages:
- Missing 2 features, but we argue that the 2 features not included typically are used in the wrong context and leads to misuse.
- Difficult to argue that the DSL is better/more approachable compared to other tools (plantuml, mermaid, etc.)
    - The "Potential Additions" could be strong arguments for the use case of this DSL. 

### Potential additions
1. Parsing to SQL
2. Parsing to different notation (fork-hand notation)