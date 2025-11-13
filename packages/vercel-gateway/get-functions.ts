import { allModelsExtra, type ModelExtra } from "./model-extra";
import type { ModelId } from "./model-id";
import { models } from "./models.generated";
import { ProviderId } from "./providers.generated";

type ModelKeyForProvider<T extends ProviderId> = Extract<keyof typeof models, `${T}/${string}`>;


export function getModel<T extends ModelId>(id: T): typeof models[T] & ModelExtra {
    return {
        ...models[id],
        ...allModelsExtra[id],
    };
}

export function getModels(): readonly (typeof models[keyof typeof models] & ModelExtra)[];
export function getModels<T extends ProviderId>(args: { provider: T }): readonly (typeof models[ModelKeyForProvider<T>] & ModelExtra)[];
export function getModels(args?: { provider?: ProviderId }): readonly (typeof models[keyof typeof models] & ModelExtra)[] {
    if (!args || args.provider === undefined) {
        return Object.values(models).map((model) => ({
            ...model,
            ...allModelsExtra[model.id],
        }));
    }
    return Object.values(models).filter((model) => model.owned_by === args.provider).map((model) => ({
        ...model,
        ...allModelsExtra[model.id],
    }));
}


