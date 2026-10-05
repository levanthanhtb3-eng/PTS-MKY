export interface RetouchSettings {
  // Frequency Separation (Tách tần số da)
  fsEnabled: boolean;
  fsRadius: number; // 2 - 20 px
  fsSmoothness: number; // 0 - 100%
  fsTextureSharpness: number; // 0 - 100%
  fsBlemishRemoval: number; // 0 - 100%

  // Dodge & Burn (Đánh khối ánh sáng)
  dbEnabled: boolean;
  dbIntensity: number; // 0 - 100%
  dbContourTZone: number; // 0 - 100% (dodge highlights)
  dbContourCheek: number; // 0 - 100% (burn shadows)
  dbVisualAid: boolean; // B&W solar check layer

  // Face Details (Mắt, răng, môi)
  eyeBrighten: number; // 0 - 100%
  teethWhiten: number; // 0 - 100%
  lipSaturation: number; // -50 - 50%
  lipTone: string; // 'natural' | 'peach' | 'rose' | 'berry'
  antiRedness: number; // 0 - 100% (khử đỏ da)

  // Color Grading & Skin Tone (Cân màu & Tone da)
  skinTonePreset: string;
  warmth: number; // -50 - 50
  tint: number; // -50 - 50 (green/magenta)
  skinLuminance: number; // -30 - 30
  skinSaturation: number; // -50 - 50
  contrastPunch: number; // 0 - 50
  highlightGlow: number; // 0 - 50
  grain: number; // 0 - 30

  // Sharpness & Finish
  highPassSharpen: number; // 0 - 100%
  vignette: number; // 0 - 50%
}

export interface SkinTonePreset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  hex: string;
  warmth: number;
  tint: number;
  skinLuminance: number;
  skinSaturation: number;
  contrastPunch: number;
  highlightGlow: number;
}

export interface SampleImage {
  id: string;
  name: string;
  category: string;
  url: string;
}

export type ViewMode = 'photoshop-docked' | 'studio-expanded';
export type CompareMode = 'split' | 'side-by-side' | 'toggle';
