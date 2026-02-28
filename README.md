# OpenClaw Prompt Shortcuts Plugin

Cross-platform prompt shortcuts for OpenClaw — type a trigger keyword to expand it into a full prompt before sending to the AI.

## How It Works

When you type `/translate hello world` in any channel (Discord, Telegram, etc.), the plugin intercepts the message via the `before_prompt_build` hook and injects your pre-written prompt as context before it reaches the AI:

```
AI receives:
"Please translate the following to Traditional Chinese, preserving the original tone and format:

hello world"
```

The prompt is **only injected when triggered** — zero context window cost when not in use.

Telegram group commands with `@BotName` are also supported (e.g. `/translate@YourBot hello world`).

## Installation

### Option 1: Config load path

Add to your `openclaw.json`:

```json
{
  "plugins": {
    "load": {
      "paths": ["/path/to/openclaw-prompt-shortcuts"]
    }
  }
}
```

### Option 2: Symlink

```bash
ln -s /path/to/openclaw-prompt-shortcuts ~/.openclaw/extensions/prompt-shortcuts
```

## Configuration

### Adding Shortcuts

Add shortcuts under `plugins.entries.prompt-shortcuts.config` in `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "prompt-shortcuts": {
        "enabled": true,
        "config": {
          "shortcuts": [
            {
              "trigger": "/translate",
              "prompt": "Please translate the following to Traditional Chinese, preserving the original tone and format:\n\n{{input}}",
              "description": "Translate to Traditional Chinese"
            },
            {
              "trigger": "/summarize",
              "prompt": "Please summarize the following content into 3-5 key points:\n\n{{input}}",
              "description": "Summarize key points"
            },
            {
              "trigger": "/debug",
              "prompt": "Please analyze the following error, identify the root cause, and suggest a fix:\n\n{{input}}",
              "description": "Debug analysis"
            },
            {
              "trigger": "/lesson",
              "prompt": "Save the following as a lesson to memory:\n1. Use memory_store with category=fact, importance=0.85\n2. Use memory_store with category=decision, importance=0.9\n3. Use memory_recall to verify both are retrievable\n4. Reply with both memory IDs\n\nContent: {{input}}",
              "description": "Save lesson to memory"
            }
          ]
        }
      }
    }
  }
}
```

Each shortcut requires:
- `trigger` — The keyword (must start with `/`, auto-added if missing)
- `prompt` — The prompt template. Use `{{input}}` as a placeholder for the user's text after the trigger

Optional:
- `description` — Shown in the `/shortcuts` listing

### Telegram: Show Shortcuts in the `/` Menu

To make your shortcuts appear in Telegram's autocomplete menu when users type `/`, add them to `channels.telegram.customCommands` in `openclaw.json`:

> **Note:** Telegram command names only allow `a-z`, `0-9`, and `_` (max 32 characters). Non-ASCII triggers (e.g. `/翻譯`) need an ASCII alias in `customCommands`.

```json
{
  "channels": {
    "telegram": {
      "customCommands": [
        { "command": "translate", "description": "Translate to Traditional Chinese" },
        { "command": "lesson",    "description": "Save lesson to memory" }
      ]
    }
  }
}
```

The command names in `customCommands` must match the triggers in your shortcuts config (without the `/`). After updating, restart the gateway:

```bash
systemctl --user restart openclaw-gateway
```

## Commands

- `/shortcuts` — List all configured prompt shortcuts

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{input}}` | Replaced with the user's text after the trigger keyword. Removed (and prompt trimmed) if no text follows the trigger. |

## Matching Rules

- Triggers are **case-insensitive**
- Trigger must appear at the **start** of the message
- Supports both `/trigger text` (prefix) and `/trigger` alone (exact)
- Telegram group format `/trigger@BotName text` is automatically normalized
- First matching shortcut wins

## Examples

| Input | AI receives |
|-------|-------------|
| `/translate hello world` | Translate prompt + "hello world" |
| `/summarize long article...` | Summarize prompt + article text |
| `/debug TypeError: ...` | Debug prompt + error message |
| `/lesson never deploy on Friday` | Lesson prompt + the lesson |
| `/translate@YourBot hello` | Same as `/translate hello` |
| `/translate` (no text) | Translate prompt with `{{input}}` removed |
