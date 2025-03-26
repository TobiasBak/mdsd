import {Expression} from "./generated/ast.js";

export function leftRecursionCalculator(exp: Expression): number{

    switch(exp.$type){
        case "Integer":
            return exp.value;
        case "Unary":
            return leftRecursionCalculator(exp.expression)**0.5;
        default:
            break;
    }

    const expLeftSide = leftRecursionCalculator(exp.left);
    const expRightSide = leftRecursionCalculator(exp.right);
    switch(exp.$type){
        case "Addition":
            return exp.operator === "+" ? expLeftSide + expRightSide : expLeftSide - expRightSide;
        case "Multiplication":
            return exp.operator === "*" ? expLeftSide * expRightSide : expLeftSide / expRightSide;
        case "Exponent":
            return Math.pow(expLeftSide, expRightSide);
        default:
            throw new Error("Unknown expression type: " +
                (exp as Expression).$type);
    }
    
}


