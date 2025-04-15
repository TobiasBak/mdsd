import {DefaultScopeProvider, ReferenceInfo, Scope} from "langium";

export class ThorScopeProvider extends DefaultScopeProvider {
    override getScope(context: ReferenceInfo): Scope {

        // console.log(context)
        return super.getScope(context);
    }
}