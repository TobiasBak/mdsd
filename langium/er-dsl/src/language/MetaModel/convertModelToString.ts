import type { Model as LangiumModel } from '../generated/ast.js';
import { instantiateMetaModelFromLangiumModel } from './Instantiator.js';

export function convertModelToString(model: LangiumModel): string {
    const metaModel = instantiateMetaModelFromLangiumModel(model);
    let result = "Model:\n";

    for (const item of metaModel) {
        result += item.toString();
    }

    return result;

}
