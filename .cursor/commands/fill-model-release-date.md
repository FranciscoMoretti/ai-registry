I want you to run pnpm check-types for packages/vercel-gateway/package.json until no more errors.

You'll find 2 kind of errors

1. a model is not in CustomModelExtraModelId anymore -> remove it from the manualModelExtra dictionary
2. a model is missing in the dictionary -> search for its release date

Repeat until no more errors
