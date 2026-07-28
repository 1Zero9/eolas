# AI provider wrapper (Gemini)

Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`), then call `generateGeminiText(prompt)` from any server route.
Write prompt-builder functions alongside it (see Eolas' `buildBrainstormPrompt` / `buildBuildBriefPrompt` for the pattern) rather than inlining prompts at the call site.
