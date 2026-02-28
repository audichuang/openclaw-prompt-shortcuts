/**
 * Prompt shortcut definition.
 * Maps a trigger keyword to a prompt template.
 */
export type PromptShortcut = {
  /** Trigger keyword (e.g. "/翻譯"). Must start with "/". */
  trigger: string;
  /** Prompt template. Use {{input}} as placeholder for user text following the trigger. */
  prompt: string;
  /** Human-readable description shown in /shortcuts listing. */
  description?: string;
};

/**
 * Parse and validate shortcuts from raw plugin config.
 * Returns only valid shortcut entries with normalized triggers.
 */
export function parseShortcuts(raw: unknown): PromptShortcut[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const config = raw as Record<string, unknown>;
  const list = config.shortcuts;

  if (!Array.isArray(list)) {
    return [];
  }

  const shortcuts: PromptShortcut[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const entry = item as Record<string, unknown>;

    const trigger = typeof entry.trigger === "string" ? entry.trigger.trim() : "";
    const prompt = typeof entry.prompt === "string" ? entry.prompt : "";
    const description = typeof entry.description === "string" ? entry.description.trim() : undefined;

    if (!trigger || !prompt) {
      continue;
    }

    // Ensure trigger starts with /
    const normalizedTrigger = trigger.startsWith("/") ? trigger : `/${trigger}`;

    shortcuts.push({
      trigger: normalizedTrigger,
      prompt,
      description,
    });
  }

  return shortcuts;
}

/**
 * Extract the user's actual message from the prompt.
 * OpenClaw wraps the user message with conversation metadata,
 * so the actual user text is at the end of the prompt.
 */
function extractUserMessage(prompt: string): string {
  const trimmed = prompt.trim();
  // Find the last line(s) after the metadata block (ends with ```)
  const closingBackticks = trimmed.lastIndexOf("```\n");
  if (closingBackticks !== -1) {
    return trimmed.slice(closingBackticks + 4).trim();
  }
  return trimmed;
}

/**
 * Match a user prompt against configured shortcuts.
 * Returns the expanded prompt as prependContext, or undefined if no match.
 *
 * Matching is case-insensitive for the trigger keyword.
 * The trigger must appear at the start of the user message, optionally followed by user input.
 */
export function matchShortcut(
  prompt: string,
  shortcuts: PromptShortcut[],
): { prependContext: string; matchedTrigger: string } | undefined {
  const userMessage = extractUserMessage(prompt);
  if (!userMessage) {
    return undefined;
  }

  for (const shortcut of shortcuts) {
    const trigger = shortcut.trigger.toLowerCase();
    // Normalize Telegram group command format: /trigger@BotName → /trigger
    const normalizedMessage = userMessage.replace(/^(\/[^\s@]+)@\w+(\s|$)/, "$1$2");
    const msgLower = normalizedMessage.toLowerCase();

    // Exact match (trigger only, no extra input)
    if (msgLower === trigger) {
      const expanded = shortcut.prompt.replace(/\{\{input\}\}/g, "").replace(/\n{3,}/g, "\n\n").trim();
      return { prependContext: expanded, matchedTrigger: shortcut.trigger };
    }

    // Prefix match (trigger + space + user input)
    if (msgLower.startsWith(trigger + " ")) {
      const userInput = normalizedMessage.slice(trigger.length).trim();
      const expanded = shortcut.prompt.replace(/\{\{input\}\}/g, userInput);
      return { prependContext: expanded, matchedTrigger: shortcut.trigger };
    }
  }

  return undefined;
}

/**
 * Format the /shortcuts listing for display.
 */
export function formatShortcutsList(shortcuts: PromptShortcut[]): string {
  if (shortcuts.length === 0) {
    return "📋 No prompt shortcuts configured.\n\nAdd shortcuts in your openclaw config under `plugins.entries.prompt-shortcuts.config.shortcuts`.";
  }

  const lines = ["📋 **Prompt Shortcuts**\n"];
  for (const shortcut of shortcuts) {
    const desc = shortcut.description ? ` — ${shortcut.description}` : "";
    lines.push(`• \`${shortcut.trigger}\`${desc}`);
  }
  lines.push("");
  lines.push("Usage: type the trigger keyword followed by your text.");
  lines.push("Example: `/翻譯 hello world`");
  return lines.join("\n");
}
