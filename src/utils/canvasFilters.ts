import { RetouchSettings } from '../types/retouch';

/**
 * Fast box blur approximation for low frequency tone separation
 */
function fastBoxBlur(src: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length);
  const r = Math.max(1, Math.min(Math.round(radius), 20));

  // Horizontal blur
  const temp = new Float32Array(width * height * 4);
  const div = 2 * r + 1;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    let sumR = 0, sumG = 0, sumB = 0;

    for (let i = -r; i <= r; i++) {
      const px = Math.min(width - 1, Math.max(0, i));
      const idx = rowOffset + px * 4;
      sumR += src[idx];
      sumG += src[idx + 1];
      sumB += src[idx + 2];
    }

    for (let x = 0; x < width; x++) {
      const outIdx = rowOffset + x * 4;
      temp[outIdx] = sumR / div;
      temp[outIdx + 1] = sumG / div;
      temp[outIdx + 2] = sumB / div;

      const left = Math.max(0, x - r);
      const right = Math.min(width - 1, x + r + 1);
      const leftIdx = rowOffset + left * 4;
      const rightIdx = rowOffset + right * 4;

      sumR += src[rightIdx] - src[leftIdx];
      sumG += src[rightIdx + 1] - src[leftIdx + 1];
      sumB += src[rightIdx + 2] - src[leftIdx + 2];
    }
  }

  // Vertical blur
  for (let x = 0; x < width; x++) {
    let sumR = 0, sumG = 0, sumB = 0;

    for (let i = -r; i <= r; i++) {
      const py = Math.min(height - 1, Math.max(0, i));
      const idx = (py * width + x) * 4;
      sumR += temp[idx];
      sumG += temp[idx + 1];
      sumB += temp[idx + 2];
    }

    for (let y = 0; y < height; y++) {
      const outIdx = (y * width + x) * 4;
      dst[outIdx] = sumR / div;
      dst[outIdx + 1] = sumG / div;
      dst[outIdx + 2] = sumB / div;
      dst[outIdx + 3] = src[outIdx + 3]; // Alpha

      const top = Math.max(0, y - r);
      const bottom = Math.min(height - 1, y + r + 1);
      const topIdx = (top * width + x) * 4;
      const bottomIdx = (bottom * width + x) * 4;

      sumR += temp[bottomIdx] - temp[topIdx];
      sumG += temp[bottomIdx + 1] - temp[topIdx + 1];
      sumB += temp[bottomIdx + 2] - temp[topIdx + 2];
    }
  }

  return dst;
}

/**
 * Check if a pixel belongs to a typical human skin tone region
 */
export function isSkinPixel(r: number, g: number, b: number): number {
  // Standard Skin Color Segmenter in RGB & YCbCr space
  // Normalized skin probability (0 to 1)
  if (r < 60 || g < 40 || b < 20) return 0;
  if (r <= g || r <= b) return 0;
  if (r - g < 10) return 0;

  // Ratio check
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 15) return 0;

  // YCbCr approximation
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  if (cb >= 77 && cb <= 135 && cr >= 133 && cr <= 178) {
    // Distance from ideal skin center (cb ~ 105, cr ~ 152)
    const dist = Math.sqrt(Math.pow(cb - 105, 2) + Math.pow(cr - 152, 2));
    const factor = Math.max(0, 1 - dist / 50);
    return factor;
  }

  return 0.2;
}

/**
 * Apply the full Lumina Retouch pipeline onto target canvas
 */
export function applyRetouchPipeline(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  settings: RetouchSettings
) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  targetCanvas.width = width;
  targetCanvas.height = height;

  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });

  if (!srcCtx || !targetCtx) return;

  const originalImgData = srcCtx.getImageData(0, 0, width, height);
  const srcPixels = originalImgData.data;

  // 1. If Visual Aid is enabled (Solar Black & White inspection curve)
  if (settings.dbVisualAid) {
    const visualData = targetCtx.createImageData(width, height);
    const vPix = visualData.data;
    for (let i = 0; i < srcPixels.length; i += 4) {
      const lum = 0.299 * srcPixels[i] + 0.587 * srcPixels[i + 1] + 0.114 * srcPixels[i + 2];
      // S-curve solarization high contrast
      let solar = lum;
      if (solar < 128) {
        solar = (solar / 128) * 255;
      } else {
        solar = 255 - ((solar - 128) / 128) * 255;
      }
      vPix[i] = solar;
      vPix[i + 1] = solar;
      vPix[i + 2] = solar;
      vPix[i + 3] = 255;
    }
    targetCtx.putImageData(visualData, 0, 0);
    return;
  }

  // 2. Frequency Separation Simulation:
  // Low frequency blur
  let blurredPixels: Uint8ClampedArray | null = null;
  if (settings.fsEnabled && settings.fsSmoothness > 0) {
    blurredPixels = fastBoxBlur(srcPixels, width, height, settings.fsRadius);
  }

  const outData = targetCtx.createImageData(width, height);
  const out = outData.data;

  // Pre-calculated multipliers
  const smoothFactor = (settings.fsSmoothness / 100) * 0.85;
  const textureSharpen = 1.0 + (settings.fsTextureSharpness / 100) * 0.7;
  const blemishClean = settings.fsBlemishRemoval / 100;

  // Dodge & Burn parameters
  const dbStrength = settings.dbEnabled ? settings.dbIntensity / 100 : 0;
  const dbDodge = (settings.dbContourTZone / 100) * dbStrength * 35;
  const dbBurn = (settings.dbContourCheek / 100) * dbStrength * 35;

  // Color tone parameters
  const warmth = settings.warmth * 0.6;
  const tint = settings.tint * 0.5; // positive = magenta, negative = green
  const skinLum = settings.skinLuminance * 0.8;
  const skinSat = 1.0 + settings.skinSaturation / 100;
  const contrastFactor = 1.0 + settings.contrastPunch / 100;
  const antiRed = settings.antiRedness / 100;

  // Teeth and Eye parameters
  const eyeBoost = settings.eyeBrighten / 100;
  const teethWhiten = settings.teethWhiten / 100;

  const centerX = width * 0.5;
  const centerY = height * 0.45;
  const radiusNorm = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    const rowIdx = y * width;
    const dy = (y - centerY) / height;

    for (let x = 0; x < width; x++) {
      const idx = (rowIdx + x) * 4;
      const rOrig = srcPixels[idx];
      const gOrig = srcPixels[idx + 1];
      const bOrig = srcPixels[idx + 2];
      const aOrig = srcPixels[idx + 3];

      const dx = (x - centerX) / width;
      const skinWeight = isSkinPixel(rOrig, gOrig, bOrig);

      let r = rOrig;
      let g = gOrig;
      let b = bOrig;

      // A. Frequency Separation Step
      if (blurredPixels && skinWeight > 0.15) {
        const rBlur = blurredPixels[idx];
        const gBlur = blurredPixels[idx + 1];
        const bBlur = blurredPixels[idx + 2];

        // High frequency texture = Orig - Blur + 128
        let rHigh = (rOrig - rBlur) * textureSharpen + 128;
        let gHigh = (gOrig - gBlur) * textureSharpen + 128;
        let bHigh = (bOrig - bBlur) * textureSharpen + 128;

        // Blemish removal dampens extreme high-frequency spikes
        if (blemishClean > 0) {
          rHigh = 128 + (rHigh - 128) * (1 - blemishClean * 0.45);
          gHigh = 128 + (gHigh - 128) * (1 - blemishClean * 0.45);
          bHigh = 128 + (bHigh - 128) * (1 - blemishClean * 0.45);
        }

        // Linear Light reconstruction: 2 * (High - 128) + BlendedLow
        // Mix between original tone and smoothed tone based on smoothness & skin weight
        const curMix = smoothFactor * skinWeight;
        const lowR = rOrig * (1 - curMix) + rBlur * curMix;
        const lowG = gOrig * (1 - curMix) + gBlur * curMix;
        const lowB = bOrig * (1 - curMix) + bBlur * curMix;

        r = lowR + 2 * (rHigh - 128);
        g = lowG + 2 * (gHigh - 128);
        b = lowB + 2 * (bHigh - 128);
      }

      // B. Anti-Redness (Khử đỏ da mặt, tai, cổ)
      if (antiRed > 0 && skinWeight > 0.2) {
        if (r > g + 25) {
          const excessRed = (r - g) * 0.25 * antiRed;
          r -= excessRed;
          g += excessRed * 0.5;
        }
      }

      // C. Dodge & Burn 3D Face Contouring
      if (dbStrength > 0) {
        // T-Zone / Center face highlight (Dodge)
        const distFromCenter = Math.sqrt(dx * dx * 2.5 + dy * dy);
        if (distFromCenter < 0.35 && skinWeight > 0.2) {
          const highlightAmount = (1 - distFromCenter / 0.35) * dbDodge;
          r += highlightAmount;
          g += highlightAmount * 0.95;
          b += highlightAmount * 0.9;
        }

        // Contour Cheek / Jaw edges (Burn)
        if (distFromCenter > 0.28 && distFromCenter < 0.65 && skinWeight > 0.15) {
          const contourAmount = ((distFromCenter - 0.28) / 0.37) * dbBurn;
          r -= contourAmount;
          g -= contourAmount * 0.95;
          b -= contourAmount * 0.9;
        }
      }

      // D. Teeth Whitening & Eye Catchlight detection
      // High luminance, low saturation in central facial region
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (teethWhiten > 0 && Math.abs(dx) < 0.25 && dy > 0.05 && dy < 0.3) {
        // Teeth area: bright but slightly yellow (R > B, G > B)
        if (lum > 110 && lum < 240 && r >= b) {
          const yellowDelta = Math.max(0, (r + g) / 2 - b);
          b += yellowDelta * teethWhiten * 0.6; // remove yellow
          r += teethWhiten * 10;
          g += teethWhiten * 10;
        }
      }

      if (eyeBoost > 0 && Math.abs(dx) < 0.3 && dy > -0.25 && dy < 0.05) {
        // Eye area
        if (lum > 90) {
          r += eyeBoost * 18;
          g += eyeBoost * 18;
          b += eyeBoost * 22;
        }
      }

      // E. Skin Tone Color Grading & Balance
      if (skinWeight > 0.15) {
        // Warmth (shifts red/yellow)
        r += warmth * skinWeight;
        b -= warmth * 0.7 * skinWeight;

        // Tint (magenta vs green)
        r += tint * 0.6 * skinWeight;
        g -= tint * 0.5 * skinWeight;
        b += tint * 0.3 * skinWeight;

        // Skin Luminance
        r += skinLum * skinWeight;
        g += skinLum * skinWeight;
        b += skinLum * skinWeight;

        // Skin Saturation
        if (skinSat !== 1.0) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * (1 + (skinSat - 1) * skinWeight);
          g = gray + (g - gray) * (1 + (skinSat - 1) * skinWeight);
          b = gray + (b - gray) * (1 + (skinSat - 1) * skinWeight);
        }
      }

      // F. Contrast Punch
      if (contrastFactor !== 1.0) {
        r = (r - 128) * contrastFactor + 128;
        g = (g - 128) * contrastFactor + 128;
        b = (b - 128) * contrastFactor + 128;
      }

      // G. Highlight Glow
      if (settings.highlightGlow > 0 && skinWeight > 0.2) {
        if (lum > 140) {
          const glow = ((lum - 140) / 115) * (settings.highlightGlow / 100) * 22;
          r += glow;
          g += glow * 0.95;
          b += glow * 0.85;
        }
      }

      // H. Vignette
      if (settings.vignette > 0) {
        const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) / radiusNorm;
        const vigFactor = 1 - Math.pow(dist, 2) * (settings.vignette / 100) * 0.8;
        r *= vigFactor;
        g *= vigFactor;
        b *= vigFactor;
      }

      // Clamp 0..255
      out[idx] = Math.max(0, Math.min(255, Math.round(r)));
      out[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      out[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      out[idx + 3] = aOrig;
    }
  }

  // I. High Pass Sharpening post-filter
  if (settings.highPassSharpen > 0) {
    const sharpenAmount = (settings.highPassSharpen / 100) * 0.5;
    // Simple 3x3 unsharp kernel on target
    const copy = new Uint8ClampedArray(out);
    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      for (let x = 1; x < width - 1; x++) {
        const i = (row + x) * 4;
        const up = (row - width + x) * 4;
        const down = (row + width + x) * 4;
        const left = (row + x - 1) * 4;
        const right = (row + x + 1) * 4;

        for (let c = 0; c < 3; c++) {
          const delta = copy[i + c] * 4 - (copy[up + c] + copy[down + c] + copy[left + c] + copy[right + c]);
          out[i + c] = Math.max(0, Math.min(255, copy[i + c] + delta * sharpenAmount));
        }
      }
    }
  }

  targetCtx.putImageData(outData, 0, 0);
}

/**
 * Calculate CMYK and Skin Tone health analysis for a selected point or center face
 */
export function analyzeSkinToneMetrics(
  canvas: HTMLCanvasElement,
  sampleX?: number,
  sampleY?: number
): {
  rgb: { r: number; g: number; b: number };
  cmyk: { c: number; m: number; y: number; k: number };
  toneStatus: 'ideal' | 'too_yellow' | 'too_red' | 'too_pale';
  cmykRatioMessage: string;
  recommendation: string;
} {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      rgb: { r: 215, g: 165, b: 145 },
      cmyk: { c: 10, m: 35, y: 40, k: 5 },
      toneStatus: 'ideal',
      cmykRatioMessage: 'Tỷ lệ C:M:Y = 10 : 35 : 40 đạt chuẩn vàng chân dung',
      recommendation: 'Màu da cân bằng hoàn hảo, sẵn sàng xuất ảnh.',
    };
  }

  const cx = Math.round(sampleX ?? canvas.width * 0.5);
  const cy = Math.round(sampleY ?? canvas.height * 0.42);

  // Sample 5x5 average box
  const imgData = ctx.getImageData(
    Math.max(0, cx - 2),
    Math.max(0, cy - 2),
    Math.min(5, canvas.width - cx),
    Math.min(5, canvas.height - cy)
  );

  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  for (let i = 0; i < imgData.data.length; i += 4) {
    sumR += imgData.data[i];
    sumG += imgData.data[i + 1];
    sumB += imgData.data[i + 2];
    count++;
  }

  const r = Math.round(sumR / count);
  const g = Math.round(sumG / count);
  const b = Math.round(sumB / count);

  // RGB to CMYK
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  const c = k === 1 ? 0 : Math.round(((1 - rNorm - k) / (1 - k)) * 100);
  const m = k === 1 ? 0 : Math.round(((1 - gNorm - k) / (1 - k)) * 100);
  const y = k === 1 ? 0 : Math.round(((1 - bNorm - k) / (1 - k)) * 100);
  const kPercent = Math.round(k * 100);

  // Photoshop Color Grading "Rule of Thumb":
  // Cyan is 1/5 to 1/3 of Magenta
  // Yellow should be equal to or slightly higher (100% to 120%) than Magenta
  let toneStatus: 'ideal' | 'too_yellow' | 'too_red' | 'too_pale' = 'ideal';
  let cmykRatioMessage = '';
  let recommendation = '';

  if (y > m * 1.35) {
    toneStatus = 'too_yellow';
    cmykRatioMessage = `Vàng (Y=${y}%) vượt xa Đỏ (M=${m}%), da bị ám vàng gắt`;
    recommendation = 'Kéo thanh "Ám màu da" về phía Hồng (Tint +) và chọn Preset "Hồng Hào Tự Nhiên".';
  } else if (m > y * 1.15) {
    toneStatus = 'too_red';
    cmykRatioMessage = `Đỏ (M=${m}%) cao hơn Vàng (Y=${y}%), da bị ửng đỏ/sưng tấy`;
    recommendation = 'Tăng thanh "Khử đỏ da (Anti-Redness)" hoặc chọn Preset "Trắng Sứ Sang Trọng".';
  } else if (m < 20 && y < 25) {
    toneStatus = 'too_pale';
    cmykRatioMessage = `Mực M=${m}%, Y=${y}% quá thấp, da bị nhợt nhạt mất sức sống`;
    recommendation = 'Tăng "Độ bão hòa da" (+15) và "Độ ấm da" (+10).';
  } else {
    toneStatus = 'ideal';
    cmykRatioMessage = `Tỷ lệ C:M:Y = ${c}% : ${m}% : ${y}% đạt chuẩn vàng Photoshop`;
    recommendation = 'Tone da rất hài hòa, sắc đào tự nhiên, độ trong trẻo cao.';
  }

  return {
    rgb: { r, g, b },
    cmyk: { c, m, y, k: kPercent },
    toneStatus,
    cmykRatioMessage,
    recommendation,
  };
}

export interface ClarityAnalysisResult {
  clarityScore: number; // 0 - 100
  laplacianVariance: number;
  qualityLevel: 'soft' | 'normal' | 'crisp' | 'ultra_sharp';
  suggestedSharpen: number; // 0 - 100%
  description: string;
}

/**
 * Detect portrait image clarity/sharpness using Laplacian variance analysis
 * and recommend optimal High Pass sharpen parameters.
 */
export function detectPortraitClarity(canvas: HTMLCanvasElement): ClarityAnalysisResult {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      clarityScore: 50,
      laplacianVariance: 220,
      qualityLevel: 'normal',
      suggestedSharpen: 42,
      description: 'Độ nét tiêu chuẩn. Khuyên dùng mức High Pass 42%.',
    };
  }

  const width = canvas.width;
  const height = canvas.height;

  // Analyze the central 60% where facial features (eyes, nose, skin texture) reside
  const startX = Math.round(width * 0.2);
  const endX = Math.round(width * 0.8);
  const startY = Math.round(height * 0.15);
  const endY = Math.round(height * 0.75);

  const sampleW = Math.max(10, endX - startX);
  const sampleH = Math.max(10, endY - startY);

  const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
  const data = imgData.data;

  // Step 1: Grayscale conversion
  const gray = new Float32Array(sampleW * sampleH);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Step 2: Laplacian 3x3 kernel convolution & variance: [0, 1, 0; 1, -4, 1; 0, 1, 0]
  let laplacianSum = 0;
  let laplacianSumSq = 0;
  let count = 0;

  // Sample step for speed
  const step = Math.max(1, Math.floor(sampleW / 300));

  for (let y = 1; y < sampleH - 1; y += step) {
    const rowOffset = y * sampleW;
    for (let x = 1; x < sampleW - 1; x += step) {
      const center = gray[rowOffset + x];
      const up = gray[rowOffset - sampleW + x];
      const down = gray[rowOffset + sampleW + x];
      const left = gray[rowOffset + x - 1];
      const right = gray[rowOffset + x + 1];

      const lap = up + down + left + right - 4 * center;
      laplacianSum += lap;
      laplacianSumSq += lap * lap;
      count++;
    }
  }

  const mean = count > 0 ? laplacianSum / count : 0;
  const variance = count > 0 ? Math.max(0, laplacianSumSq / count - mean * mean) : 180;

  let suggestedSharpen: number;
  let qualityLevel: 'soft' | 'normal' | 'crisp' | 'ultra_sharp';
  let description: string;
  const clarityScore = Math.min(100, Math.max(10, Math.round(Math.sqrt(variance) * 3.5)));

  if (variance < 95) {
    qualityLevel = 'soft';
    suggestedSharpen = 65;
    description = 'Ảnh gốc dịu nét, ánh sáng tán xạ mềm. Khuyên dùng High Pass 65% để tái tạo rõ rệt sợi lông mi và vân da.';
  } else if (variance < 260) {
    qualityLevel = 'normal';
    suggestedSharpen = 42;
    description = 'Độ nét chuẩn chụp Studio. Khuyên dùng High Pass 42% để giữ da căng mịn tự nhiên và không gây gai mắt.';
  } else if (variance < 650) {
    qualityLevel = 'crisp';
    suggestedSharpen = 28;
    description = 'Ảnh gốc rất sắc nét từ ống kính cao cấp. Chỉ cần High Pass 28% là đủ tinh tế mà không bị sinh hạt viền.';
  } else {
    qualityLevel = 'ultra_sharp';
    suggestedSharpen = 15;
    description = 'Ảnh Macro chi tiết cực mạnh. Khuyên dùng High Pass 15% để tránh làm da bị cứng hoặc rạn khối.';
  }

  return {
    clarityScore,
    laplacianVariance: Math.round(variance),
    qualityLevel,
    suggestedSharpen,
    description,
  };
}

