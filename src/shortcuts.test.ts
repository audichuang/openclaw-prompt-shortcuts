import { describe, expect, it } from "vitest";
import { formatShortcutsList, matchShortcut, parseShortcuts } from "./types.js";

// ─── parseShortcuts ──────────────────────────────────────────────────

describe("parseShortcuts", () => {
  it("parses valid shortcuts from config", () => {
    const result = parseShortcuts({
      shortcuts: [
        { trigger: "/翻譯", prompt: "Translate: {{input}}", description: "翻譯" },
        { trigger: "/摘要", prompt: "Summarize: {{input}}" },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].trigger).toBe("/翻譯");
    expect(result[0].prompt).toBe("Translate: {{input}}");
    expect(result[0].description).toBe("翻譯");
    expect(result[1].trigger).toBe("/摘要");
    expect(result[1].description).toBeUndefined();
  });

  it("adds leading / if missing", () => {
    const result = parseShortcuts({
      shortcuts: [{ trigger: "debug", prompt: "Debug: {{input}}" }],
    });

    expect(result[0].trigger).toBe("/debug");
  });

  it("skips entries with missing trigger or prompt", () => {
    const result = parseShortcuts({
      shortcuts: [
        { trigger: "", prompt: "something" },
        { trigger: "/ok", prompt: "" },
        { trigger: "/valid", prompt: "Valid prompt" },
        { prompt: "no trigger" },
        { trigger: "/also-valid" },
        null,
        42,
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].trigger).toBe("/valid");
  });

  it("returns empty array for null/undefined/invalid config", () => {
    expect(parseShortcuts(null)).toEqual([]);
    expect(parseShortcuts(undefined)).toEqual([]);
    expect(parseShortcuts("string")).toEqual([]);
    expect(parseShortcuts(42)).toEqual([]);
    expect(parseShortcuts({})).toEqual([]);
    expect(parseShortcuts({ shortcuts: "not-array" })).toEqual([]);
  });

  it("trims whitespace from trigger and description", () => {
    const result = parseShortcuts({
      shortcuts: [{ trigger: "  /翻譯  ", prompt: "Translate", description: "  desc  " }],
    });

    expect(result[0].trigger).toBe("/翻譯");
    expect(result[0].description).toBe("desc");
  });
});

// ─── matchShortcut ───────────────────────────────────────────────────

describe("matchShortcut", () => {
  const shortcuts = parseShortcuts({
    shortcuts: [
      { trigger: "/翻譯", prompt: "請翻譯成繁體中文：\n\n{{input}}" },
      { trigger: "/摘要", prompt: "請整理重點摘要：\n\n{{input}}" },
      { trigger: "/lesson", prompt: "Store as lesson:\n1. memory_store fact: {{input}}\n2. memory_store decision: {{input}}" },
    ],
  });

  it("matches trigger with user input", () => {
    const result = matchShortcut("/翻譯 hello world", shortcuts);
    expect(result).toBeDefined();
    expect(result!.matchedTrigger).toBe("/翻譯");
    expect(result!.prependContext).toBe("請翻譯成繁體中文：\n\nhello world");
  });

  it("matches trigger without user input (exact match)", () => {
    const result = matchShortcut("/摘要", shortcuts);
    expect(result).toBeDefined();
    expect(result!.matchedTrigger).toBe("/摘要");
    expect(result!.prependContext).toBe("請整理重點摘要：");
  });

  it("is case-insensitive", () => {
    const result = matchShortcut("/LESSON something", shortcuts);
    expect(result).toBeDefined();
    expect(result!.matchedTrigger).toBe("/lesson");
  });

  it("replaces all {{input}} placeholders", () => {
    const result = matchShortcut("/lesson important thing", shortcuts);
    expect(result).toBeDefined();
    expect(result!.prependContext).toContain("fact: important thing");
    expect(result!.prependContext).toContain("decision: important thing");
  });

  it("returns undefined for non-matching prompt", () => {
    expect(matchShortcut("hello world", shortcuts)).toBeUndefined();
    expect(matchShortcut("/unknown command", shortcuts)).toBeUndefined();
    expect(matchShortcut("", shortcuts)).toBeUndefined();
    expect(matchShortcut("  ", shortcuts)).toBeUndefined();
  });

  it("does not match partial trigger (trigger as substring)", () => {
    // "/翻譯機" should NOT match "/翻譯"
    expect(matchShortcut("/翻譯機", shortcuts)).toBeUndefined();
  });

  it("first matching shortcut wins", () => {
    const overlapping = parseShortcuts({
      shortcuts: [
        { trigger: "/test", prompt: "First: {{input}}" },
        { trigger: "/test", prompt: "Second: {{input}}" },
      ],
    });
    const result = matchShortcut("/test hello", overlapping);
    expect(result!.prependContext).toBe("First: hello");
  });

  it("handles empty shortcuts list", () => {
    expect(matchShortcut("/翻譯 test", [])).toBeUndefined();
  });

  it("trims prompt before matching", () => {
    const result = matchShortcut("  /翻譯 hello  ", shortcuts);
    expect(result).toBeDefined();
    expect(result!.prependContext).toBe("請翻譯成繁體中文：\n\nhello");
  });

  it("matches trigger wrapped in OpenClaw metadata", () => {
    const wrapped = `Conversation info (untrusted metadata):\n\`\`\`json\n{"message_id":"123","sender_id":"456"}\n\`\`\`\n/翻譯 hello world`;
    const result = matchShortcut(wrapped, shortcuts);
    expect(result).toBeDefined();
    expect(result!.matchedTrigger).toBe("/翻譯");
    expect(result!.prependContext).toBe("請翻譯成繁體中文：\n\nhello world");
  });

  it("matches Telegram group command with @BotName suffix", () => {
    const result = matchShortcut("/翻譯@AudiOpenClawBot hello world", shortcuts);
    expect(result).toBeDefined();
    expect(result!.matchedTrigger).toBe("/翻譯");
    expect(result!.prependContext).toBe("請翻譯成繁體中文：\n\nhello world");
  });

  it("matches Telegram group command with @BotName and no input (exact)", () => {
    const result = matchShortcut("/摘要@AudiOpenClawBot", shortcuts);
    expect(result).toBeDefined();
    expect(result!.matchedTrigger).toBe("/摘要");
  });
});

// ─── formatShortcutsList ─────────────────────────────────────────────

describe("formatShortcutsList", () => {
  it("formats shortcuts with descriptions", () => {
    const shortcuts = parseShortcuts({
      shortcuts: [
        { trigger: "/翻譯", prompt: "...", description: "翻譯成繁體中文" },
        { trigger: "/摘要", prompt: "...", description: "整理重點摘要" },
      ],
    });

    const output = formatShortcutsList(shortcuts);
    expect(output).toContain("/翻譯");
    expect(output).toContain("翻譯成繁體中文");
    expect(output).toContain("/摘要");
    expect(output).toContain("整理重點摘要");
  });

  it("formats shortcuts without descriptions", () => {
    const shortcuts = parseShortcuts({
      shortcuts: [{ trigger: "/test", prompt: "..." }],
    });

    const output = formatShortcutsList(shortcuts);
    expect(output).toContain("/test");
    expect(output).not.toContain("—");
  });

  it("shows help message when no shortcuts configured", () => {
    const output = formatShortcutsList([]);
    expect(output).toContain("No prompt shortcuts configured");
    expect(output).toContain("plugins.entries.prompt-shortcuts.config.shortcuts");
  });
});
