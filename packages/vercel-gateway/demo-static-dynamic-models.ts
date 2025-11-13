
const models = [
    {
        id: 'openai/gpt-5',
        provider: 'openai',
    },
    {
        id: 'openai/gpt-4o',
        provider: 'openai',
    },
    {
        id: 'openai/gpt-4o-mini',
        provider: 'openai',
    },{
        id: "anthropic/claude-3-5-sonnet",
        provider: 'anthropic',
    }
] as const

type ModelId = (typeof models)[number]['id']
type ProviderId = (typeof models)[number]['provider']

const fetchedPrices: Record<ModelId, number> = {
    'openai/gpt-5': 0.00000125,
    'openai/gpt-4o': 0.0000015,
    'openai/gpt-4o-mini': 0.0000015,
    'anthropic/claude-3-5-sonnet': 0.000003,
}

const newAll = models.map((model) => {
    const modelId = model.id
    return {
        ...model,
        price: fetchedPrices[modelId],
    }
})


