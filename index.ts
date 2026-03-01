import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { formatShortcutsList, matchShortcut, parseShortcuts } from "./src/types.js";

const plugin = {
  id: "prompt-shortcuts",
  name: "Prompt Shortcuts",
  description:
    "Cross-platform prompt shortcuts — type a trigger keyword to expand it into a full prompt before sending to the AI.",
  configSchema: {
    parse: parseShortcuts,
  },
  register(api: OpenClawPluginApi) {
    const shortcuts = api.pluginConfig as ReturnType<typeof parseShortcuts>;

    if (shortcuts.length > 0) {
      api.logger.info(
        `Prompt Shortcuts: loaded ${shortcuts.length} shortcut(s): ${shortcuts.map((s) => s.trigger).join(", ")}`,
      );
    }

    // ─── Hook: before_prompt_build ─────────────────────────────────────
    // Detect trigger keywords in the user's prompt.
    // If matched, inject the expanded prompt as prependContext.
    // The original prompt is still sent to the AI, but prepended with the expanded instructions.
    api.on("before_prompt_build", (event: { prompt: string }, _ctx: unknown) => {
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
  },
};

export default plugin;
