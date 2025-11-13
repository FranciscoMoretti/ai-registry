// DEMO to evaluate type definitions

import { getModel, getModels } from "./get-functions";

const model = getModel("openai/gpt-5")
const allModels = getModels()
const googleModels = getModels({ provider: 'google' })

googleModels.map((model) => model.name)

