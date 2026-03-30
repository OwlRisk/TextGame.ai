/**
 * Re-export barrel — all template definitions now live in src/lib/templates/.
 * This file exists so existing imports (`from "@/lib/game-templates"`) continue to work.
 */
export type { GameTemplate, QuickAction } from "./templates";
export {
  GAME_TEMPLATES,
  getGameTemplate,
  getTemplateHexColor,
  getAvatarStyleForTemplate,
} from "./templates";
