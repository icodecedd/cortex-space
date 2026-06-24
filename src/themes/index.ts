import { caffeine } from "./caffeine";
import { claude } from "./claude";
import { cursor } from "./cursor";
import { cortex } from "./cortex";
import { tokyoNight } from "./tokyo-night";
import { nord } from "./nord";
import { catppuccin } from "./catppuccin";
import { dracula } from "./dracula";
import { everforest } from "./everforest";
import { gruvbox } from "./gruvbox";
import { kanagawa } from "./kanagawa";
import { kanagawaDragon } from "./kanagawa-dragon";
import { rosePine } from "./rose-pine";
import { tide } from "./tide";
import type { Theme } from "../lib/theme-types";

export const BUILTIN_THEMES: Record<string, Theme> = {
  cortex,
  claude,
  cursor,
  "tokyo-night": tokyoNight,
  nord,
  catppuccin,
  caffeine,
  dracula,
  everforest,
  gruvbox,
  kanagawa,
  "kanagawa-dragon": kanagawaDragon,
  "rose-pine": rosePine,
  tide,
};

export {
  cortex,
  claude,
  cursor,
  tokyoNight,
  nord,
  catppuccin,
  caffeine,
  dracula,
  everforest,
  gruvbox,
  kanagawa,
  kanagawaDragon,
  rosePine,
  tide,
};
