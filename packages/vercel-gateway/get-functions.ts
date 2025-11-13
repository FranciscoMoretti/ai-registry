import { ModelId, models } from "./models.generated";
import { ProviderId } from "./providers.generated";

type ModelKeyForProvider<T extends ProviderId> = Extract<keyof typeof models, `${T}/${string}`>;



export function getModel<T extends ModelId>(id: T): typeof models[T] {
    return models[id];
}

export function getModels(): readonly typeof models[keyof typeof models][];
export function getModels<T extends ProviderId>(args: { provider: T }): readonly (typeof models[ModelKeyForProvider<T>])[];
export function getModels(args?: { provider?: ProviderId }): readonly typeof models[keyof typeof models][] {
    if (!args || args.provider === undefined) {
        return Object.values(models);
    }
    return Object.values(models).filter((model) => model.owned_by === args.provider);
}


