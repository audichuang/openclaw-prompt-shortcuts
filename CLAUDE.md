# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An OpenClaw plugin that provides cross-platform prompt shortcuts. Users type a trigger keyword (e.g. `/translate hello world`) and the plugin intercepts the message via the `before_prompt_build` hook, injecting an expanded prompt template as `prependContext` before it reaches the AI.

Supports Telegram group command format (`/trigger@BotName text`) by normalizing the `@BotName` suffix before matching.

## Commands

- `npm test` — run all tests (vitest)
- `npx vitest run src/shortcuts.test.ts` — run a single test file

## Architecture

Small, self-contained OpenClaw plugin with no build step (TypeScript loaded directly by OpenClaw).

- **`index.ts`** — Plugin entry point. Exports `register(api)` which hooks into `before_prompt_build` and registers the `/shortcuts` command. OpenClaw plugin API types are defined inline to avoid depending on `@openclaw/plugin-sdk`.
- **`src/types.ts`** — Core logic: `parseShortcuts()` validates config, `matchShortcut()` does trigger matching, `formatShortcutsList()` renders the `/shortcuts` output.
- **`src/shortcuts.test.ts`** — Tests for all three exported functions (20 tests).
- **`openclaw.plugin.json`** — Plugin manifest with `configSchema` defining the shortcuts array structure.

## Key Conventions

- Triggers must start with `/` (auto-normalized if missing).
- `{{input}}` is the template variable replaced with user text after the trigger keyword.
- Matching is case-insensitive; first match wins.
- Telegram group format `/trigger@BotName text` is normalized to `/trigger text` before matching — regex: `^(\/[^\s@]+)@\w+(\s|$)` → `$1$2`.
- No external dependencies beyond vitest for testing.

## Telegram `/` Menu Integration

To make shortcuts appear in Telegram's autocomplete menu, add `customCommands` to `channels.telegram` in `openclaw.json`. Telegram only allows `a-z`, `0-9`, `_` in command names — non-ASCII triggers need an ASCII alias.

```json
"channels": {
  "telegram": {
    "customCommands": [
      { "command": "lesson", "description": "Save lesson to memory" }
    ]
  }
}
```

`customCommands` only adds the menu entry — messages still flow through the normal agent pipeline and `before_prompt_build` hook fires as usual.
