# OpenClaw Prompt Shortcuts Plugin

Cross-platform prompt shortcuts for OpenClaw — type a trigger keyword to expand it into a full prompt before sending to the AI.

## How It Works

When you type `/翻譯 hello world` in any channel (Discord, Telegram, Slack, etc.), the plugin intercepts the message before it reaches the AI and injects your pre-written prompt as context:

```
AI receives:
"請將以下內容翻譯成繁體中文，保持原文語氣和格式：

hello world"

(followed by the original: /翻譯 hello world)
```

The prompt is **only injected when triggered** — zero context window cost when not in use.

## Installation

### Option 1: Symlink (Recommended for development)

```bash
ln -s /path/to/openclaw-prompt-shortcuts ~/.openclaw/extensions/prompt-shortcuts
```

### Option 2: Config load path

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

## Configuration

Add your shortcuts under `plugins.entries.prompt-shortcuts.config` in `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "prompt-shortcuts": {
        "enabled": true,
        "config": {
          "shortcuts": [
            {
              "trigger": "/翻譯",
              "prompt": "請將以下內容翻譯成繁體中文，保持原文語氣和格式：\n\n{{input}}",
              "description": "翻譯成繁體中文"
            },
            {
              "trigger": "/摘要",
              "prompt": "請針對以下內容，整理出 3-5 個重點摘要，使用繁體中文：\n\n{{input}}",
              "description": "整理重點摘要"
            },
            {
              "trigger": "/英文",
              "prompt": "Please translate the following to English, maintaining the original tone:\n\n{{input}}",
              "description": "Translate to English"
            },
            {
              "trigger": "/改寫",
              "prompt": "請將以下內容改寫成更專業正式的語氣：\n\n{{input}}",
              "description": "專業語氣改寫"
            },
            {
              "trigger": "/debug",
              "prompt": "請分析以下錯誤訊息，找出根本原因並提供解決方案：\n\n{{input}}",
              "description": "除錯分析"
            },
            {
              "trigger": "/lesson",
              "prompt": "When processing this content:\n1. Use memory_store to save as category=fact (the raw knowledge)\n2. Use memory_store to save as category=decision (actionable takeaway)\n3. Confirm what was saved\n\nContent: {{input}}",
              "description": "儲存為學習記錄"
            }
          ]
        }
      }
    }
  }
}
```

## Commands

- `/shortcuts` — List all configured prompt shortcuts

## Template Variables

- `{{input}}` — Replaced with the user's text after the trigger keyword

## Examples

| You type | AI receives |
|----------|-------------|
| `/翻譯 hello world` | 請將以下內容翻譯成繁體中文... hello world |
| `/lesson never deploy on Friday` | Store as lesson with memory_store... |
| `/debug TypeError: Cannot read property 'x'` | 請分析以下錯誤... |
