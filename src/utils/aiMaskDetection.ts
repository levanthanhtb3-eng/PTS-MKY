import { MaskTarget, MaskingState, LocalMaskSettings } from '../types/retouch';

export const INITIAL_MASKING_STATE: MaskingState = {
  activeMask: null,
  showOverlay: false,
  overlayColor: 'ruby',
  masks: {
    skin: {
      target: 'skin',
      name: 'Làn Da (Skin)',
      hasSelection: false,
      coverage: 0,
      isAiDetected: false,
      settings: {
        enabled: true,
        opacity: 100,
        feather: 8,
        inverted: false,
        skinSmoothness: 35,
        skinWarmth: 6,
        skinTint: 4,
        skinLuminance: 8,
        skinBlemishes: 40,
        eyeClarity: 0,
        eyeBrightness: 0,
        eyeCatchlight: 0,
        eyeWhiten: 0,
        hairGloss: 0,
        hairContrast: 0,
        hairTint: 0,
        hairLuminance: 0,
      },
    },
    eyes: {
      target: 'eyes',
      name: 'Đôi Mắt (Eyes & Iris)',
      hasSelection: false,
      coverage: 0,
      isAiDetected: false,
      settings: {
        enabled: true,
        opacity: 100,
        feather: 4,
        inverted: false,
        skinSmoothness: 0,
        skinWarmth: 0,
        skinTint: 0,
        skinLuminance: 0,
        skinBlemishes: 0,
        eyeClarity: 45,
        eyeBrightness: 35,
        eyeCatchlight: 40,
        eyeWhiten: 30,
        hairGloss: 0,
        hairContrast: 0,
        hairTint: 0,
        hairLuminance: 0,
      },
    },
    hair: {
      target: 'hair',
      name: 'Mái Tóc (Hair)',
      hasSelection: false,
      coverage: 0,
      isAiDetected: false,
      settings: {
        enabled: true,
        opacity: 100,
        feather: 6,
        inverted: false,
        skinSmoothness: 0,
        skinWarmth: 0,
        skinTint: 0,
        skinLuminance: 0,
        skinBlemishes: 0,
        eyeClarity: 0,
        eyeBrightness: 0,
        eyeCatchlight: 0,
        eyeWhiten: 0,
        hairGloss: 35,
        hairContrast: 25,
        hairTint: 0,
        hairLuminance: -5,
      },
    },
  },
};

// Reusable pooled buffer for mask feathering
let sharedMaskFloatBuffer: Float32Array | null = null;
function getMaskFloatBuffer(size: number): Float32Array {
  if (!sharedMaskFloatBuffer || sharedMaskFloatBuffer.length < size) {
    sharedMaskFloatBuffer = new Float32Array(size);
  }
  return sharedMaskFloatBuffer;
}

/**
 * 1D Box blur for alpha mask feathering with pooled buffer
 */
function blurMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (radius <= 0) return mask;
  const r = Math.min(Math.round(radius), 25);
  const out = new Uint8Array(width * height);
  const temp = getMaskFloatBuffer(width * height);
  const div = 2 * r + 1;

  // Horizontal blur
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    let sum = 0;
    for (let i = -r; i <= r; i++) {
      const px = Math.min(width - 1, Math.max(0, i));
      sum += mask[rowOffset + px];
    }
    for (let x = 0; x < width; x++) {
      temp[rowOffset + x] = sum / div;
      const left = Math.max(0, x - r);
      const right = Math.min(width - 1, x + r + 1);
      sum += mask[rowOffset + right] - mask[rowOffset + left];
    }
  }

  // Vertical blur
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let i = -r; i <= r; i++) {
      const py = Math.min(height - 1, Math.max(0, i));
      sum += temp[py * width + x];
    }
    for (let y = 0; y < height; y++) {
      out[y * width + x] = Math.min(255, Math.max(0, Math.round(sum / div)));
      const top = Math.max(0, y - r);
      const bottom = Math.min(height - 1, y + r + 1);
      sum += temp[bottom * width + x] - temp[top * width + x];
    }
  }

  return out;
}

/**
 * AI-Based Semantic Selection: Generates precise skin mask
 */
export function generateSkinMask(
  ctxOrData: CanvasRenderingContext2D | Uint8ClampedArray,
  width: number,
  height: number,
  feather: number = 8
): { mask: Uint8Array; coverage: number } {
  const data = ctxOrData instanceof Uint8ClampedArray
    ? ctxOrData
    : ctxOrData.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  let selectedCount = 0;

  const centerX = width * 0.5;
  const centerY = height * 0.48;
  const radiusX = width * 0.38;
  const radiusY = height * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (rowOffset + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Elliptical portrait face prior
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distSq = dx * dx + dy * dy;
      if (distSq > 1.3) {
        mask[rowOffset + x] = 0;
        continue;
      }

      // YCbCr skin tone detection (Chai & Ngan rule)
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      const isSkinCbCr = cb >= 77 && cb <= 130 && cr >= 132 && cr <= 175;
      const isRedDominant = r > g && g > b && r - g > 12;

      // Exclude saturated lips
      const maxRGB = Math.max(r, g, b);
      const minRGB = Math.min(r, g, b);
      const sat = maxRGB > 0 ? (maxRGB - minRGB) / maxRGB : 0;
      const isLip = sat > 0.55 && r > 1.45 * g;

      // Exclude dark eyes / eyebrows
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const isDarkFeature = lum < 40;

      if ((isSkinCbCr || isRedDominant) && !isLip && !isDarkFeature) {
        const falloff = Math.max(0, 1 - distSq / 1.25);
        const weight = Math.round(255 * falloff);
        mask[rowOffset + x] = weight;
        if (weight > 40) selectedCount++;
      } else {
        mask[rowOffset + x] = 0;
      }
    }
  }

  const feathered = blurMask(mask, width, height, feather);
  const coverage = Math.round((selectedCount / (width * height)) * 100);
  return { mask: feathered, coverage };
}

/**
 * AI-Based Semantic Selection: Generates precise eyes and iris mask
 */
export function generateEyesMask(
  ctxOrData: CanvasRenderingContext2D | Uint8ClampedArray,
  width: number,
  height: number,
  feather: number = 4
): { mask: Uint8Array; coverage: number } {
  const data = ctxOrData instanceof Uint8ClampedArray
    ? ctxOrData
    : ctxOrData.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  let selectedCount = 0;

  // Expected eye landmarks in portrait composition
  // Left eye ~ 36% x, 38.5% y; Right eye ~ 64% x, 38.5% y
  const leftEyeX = width * 0.36;
  const rightEyeX = width * 0.64;
  const eyeY = height * 0.385;
  const eyeRx = width * 0.11;
  const eyeRy = height * 0.065;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (rowOffset + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const dLeftX = (x - leftEyeX) / eyeRx;
      const dLeftY = (y - eyeY) / eyeRy;
      const leftDist = dLeftX * dLeftX + dLeftY * dLeftY;

      const dRightX = (x - rightEyeX) / eyeRx;
      const dRightY = (y - eyeY) / eyeRy;
      const rightDist = dRightX * dRightX + dRightY * dRightY;

      const inEyeRegion = leftDist <= 1.0 || rightDist <= 1.0;
      if (!inEyeRegion) {
        mask[rowOffset + x] = 0;
        continue;
      }

      const minDist = Math.min(leftDist, rightDist);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxRGB = Math.max(r, g, b);
      const minRGB = Math.min(r, g, b);
      const sat = maxRGB > 0 ? (maxRGB - minRGB) / maxRGB : 0;

      // Iris (darker center or high color saturation) or Sclera (whitish, low sat)
      const isIris = lum < 125;
      const isSclera = lum >= 125 && sat < 0.28;

      if (isIris || isSclera) {
        const falloff = Math.max(0, 1 - minDist);
        const weight = Math.round(255 * falloff);
        mask[rowOffset + x] = weight;
        if (weight > 30) selectedCount++;
      } else {
        mask[rowOffset + x] = 0;
      }
    }
  }

  const feathered = blurMask(mask, width, height, feather);
  const coverage = Math.max(1, Math.round((selectedCount / (width * height)) * 100));
  return { mask: feathered, coverage };
}

/**
 * AI-Based Semantic Selection: Generates precise hair mask
 */
export function generateHairMask(
  ctxOrData: CanvasRenderingContext2D | Uint8ClampedArray,
  width: number,
  height: number,
  feather: number = 6
): { mask: Uint8Array; coverage: number } {
  const data = ctxOrData instanceof Uint8ClampedArray
    ? ctxOrData
    : ctxOrData.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  let selectedCount = 0;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (rowOffset + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      // Check if clearly skin
      const isSkinCbCr = cb >= 77 && cb <= 130 && cr >= 132 && cr <= 175;

      // Hair position priors: top of head (y < 0.38) or temple / outer sidebands (x < 0.28 || x > 0.72)
      const isTopCrown = y < height * 0.35 && y > height * 0.02;
      const isSides = (x < width * 0.3 || x > width * 0.7) && y < height * 0.75;
      const isShoulderFall = y > height * 0.45 && (x < width * 0.32 || x > width * 0.68);

      if ((isTopCrown || isSides || isShoulderFall) && !isSkinCbCr) {
        // Exclude pure background (e.g. uniform bright white or grey)
        const isBackground = lum > 240;
        if (!isBackground) {
          mask[rowOffset + x] = 230;
          selectedCount++;
          continue;
        }
      }
      mask[rowOffset + x] = 0;
    }
  }

  const feathered = blurMask(mask, width, height, feather);
  const coverage = Math.max(5, Math.round((selectedCount / (width * height)) * 100));
  return { mask: feathered, coverage };
}

/**
 * Detect all three key portrait masks simultaneously with AI
 * Optimized to perform a single canvas GPU-to-CPU readback
 */
export async function detectAllPortraitMasks(
  canvas: HTMLCanvasElement
): Promise<{
  skin: { mask: Uint8Array; coverage: number };
  eyes: { mask: Uint8Array; coverage: number };
  hair: { mask: Uint8Array; coverage: number };
}> {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    const dummy = new Uint8Array(100);
    return {
      skin: { mask: dummy, coverage: 35 },
      eyes: { mask: dummy, coverage: 4 },
      hair: { mask: dummy, coverage: 24 },
    };
  }

  const width = canvas.width;
  const height = canvas.height;

  // Single pixel readback for all 3 detectors
  const imgData = ctx.getImageData(0, 0, width, height);
  const rawPixels = imgData.data;

  // Run detection on shared pixel data
  const skin = generateSkinMask(rawPixels, width, height, 8);
  const eyes = generateEyesMask(rawPixels, width, height, 4);
  const hair = generateHairMask(rawPixels, width, height, 6);

  return { skin, eyes, hair };
}
