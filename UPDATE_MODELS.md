# How to update the models

1. Run `pnpm models:sync` to fetch the latest models from the Vercel AI Gateway
2. Run the `.cursor/commands/fill-model-release-date.md` command to fill the release date for the models
3. If a new provider is available,
   1. add the icon to `get-provider-icon.tsx` (LobeHub Icons component)
   2. add the icon to `get-provider-icon-url.tsx`
   3. download the icon as mono svg from https://icons.lobehub.com/ and add it to the `apps/website/public/providers` folder
4. Run `pnpm changset` to create a new changeset
