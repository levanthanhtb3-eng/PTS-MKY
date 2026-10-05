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

export type MaskTarget = 'skin' | 'eyes' | 'hair';

export interface LocalMaskSettings {
  enabled: boolean;
  opacity: number; // 0 - 100%
  feather: number; // 0 - 30 px
  inverted: boolean;
  
  // Specific adjustments for Skin:
  skinSmoothness: number; // 0 - 100
  skinWarmth: number; // -50 - 50
  skinTint: number; // -50 - 50
  skinLuminance: number; // -50 - 50
  skinBlemishes: number; // 0 - 100

  // Specific adjustments for Eyes:
  eyeClarity: number; // 0 - 100
  eyeBrightness: number; // 0 - 100
  eyeCatchlight: number; // 0 - 100
  eyeWhiten: number; // 0 - 100

  // Specific adjustments for Hair:
  hairGloss: number; // 0 - 100
  hairContrast: number; // 0 - 100
  hairTint: number; // -50 - 50
  hairLuminance: number; // -50 - 50
}

export interface MaskData {
  target: MaskTarget;
  name: string;
  hasSelection: boolean;
  coverage: number; // Percentage 0 - 100
  isAiDetected: boolean;
  settings: LocalMaskSettings;
  // Cached mask byte array (width * height, 0 to 255)
  maskBuffer?: Uint8Array | null;
  maskWidth?: number;
  maskHeight?: number;
}

export interface MaskingState {
  activeMask: MaskTarget | null;
  showOverlay: boolean;
  overlayColor: 'ruby' | 'emerald' | 'cyan';
  masks: Record<MaskTarget, MaskData>;
}

export type ViewMode = 'photoshop-docked' | 'studio-expanded';
export type CompareMode = 'split' | 'side-by-side' | 'toggle';

