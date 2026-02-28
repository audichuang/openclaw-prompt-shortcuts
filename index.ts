import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { formatShortcutsList, matchShortcut, parseShortcuts } from "./src/types.js";

export default function register(api: OpenClawPluginApi) {
  const shortcuts = parseShortcuts(api.pluginConfig);

  if (shortcuts.length > 0) {
    api.logger.info(
      `Prompt Shortcuts: loaded ${shortcuts.length} shortcut(s): ${shortcuts.map((s) => s.trigger).join(", ")}`,
    );
  }

  // ─── Hook: before_prompt_build ─────────────────────────────────────
  // Detect trigger keywords in the user's prompt.
  // If matched, inject the expanded prompt as prependContext.
  // The original prompt is still sent to the AI, but prepended with the expanded instructions.
  api.on("before_prompt_build", (event) => {
    if (shortcuts.length === 0) {
      return undefined;
    }

    const result = matchShortcut(event.prompt, shortcuts);
    if (!result) {
      return undefined;
    }

    api.logger.info(`Prompt Shortcuts: matched "${result.matchedTrigger}"`);
    return { prependContext: result.prependContext };
  });

  // ─── Command: /shortcuts ───────────────────────────────────────────
  // List all configured prompt shortcuts.
  api.registerCommand({
    name: "shortcuts",
    description: "List all configured prompt shortcuts",
    acceptsArgs: false,
    requireAuth: false,
    handler: () => {
      return { text: formatShortcutsList(shortcuts) };
    },
  });
}
