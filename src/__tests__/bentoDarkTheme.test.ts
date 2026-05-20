import { describe, it, expect } from "vitest";
import {
  BENTO_DARK_TEXT_PAIRS,
  contrastRatio,
  relativeLuminance,
  textTokensAvoidPureWhite,
} from "../theme/bentoDarkTheme.js";

const WCAG_AA_NORMAL = 4.5;

describe("bentoDarkTheme", () => {
  it("does not use pure white for text token keys", () => {
    expect(textTokensAvoidPureWhite()).toBe(true);
  });

  it("documented UI pairs meet WCAG AA for normal text", () => {
    for (const { bg, fg, label } of BENTO_DARK_TEXT_PAIRS) {
      const r = contrastRatio(bg, fg);
      expect(r, label).not.toBeNull();
      expect(r as number, label).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    }
  });

  it("avoids light-on-light and dark-on-dark (separation heuristic)", () => {
    for (const { bg, fg, label } of BENTO_DARK_TEXT_PAIRS) {
      const Lb = relativeLuminance(bg);
      const Lf = relativeLuminance(fg);
      expect(Lb, `${label} bg luminance`).not.toBeNull();
      expect(Lf, `${label} fg luminance`).not.toBeNull();
      const bothLight = (Lb as number) > 0.55 && (Lf as number) > 0.55;
      const bothDark = (Lb as number) < 0.28 && (Lf as number) < 0.28;
      expect(bothLight, `${label}: light text on light background`).toBe(false);
      expect(bothDark, `${label}: dark text on dark background`).toBe(false);
    }
  });
});
