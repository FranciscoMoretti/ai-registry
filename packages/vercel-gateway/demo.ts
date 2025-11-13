// DEMO to evaluate type definitions

import { getModel, getModels } from "./get-functions";
import { ModelId } from "./models.generated";

const model = getModel("openai/gpt-5");
const allModels = getModels()
const googleModels = getModels({ provider: 'google' })

googleModels.map((model) => model.name)

