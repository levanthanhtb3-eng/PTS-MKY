import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  SplitSquareVertical,
  Columns,
  Eye,
  Pipette,
  Check,
  ImageIcon
} from 'lucide-react';
import { RetouchSettings, CompareMode, SampleImage, MaskingState } from '../types/retouch';
import { applyRetouchPipeline, analyzeSkinToneMetrics } from '../utils/canvasFilters';

interface CanvasViewportProps {
  settings: RetouchSettings;
  sampleImages: SampleImage[];
  selectedSampleId: string;
  maskingState?: MaskingState;
  onSelectSample: (id: string) => void;
  onCustomImageUploaded: (url: string) => void;
  onSampleColorPicked?: (cmykInfo: ReturnType<typeof analyzeSkinToneMetrics>) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  settings,
  sampleImages,
  selectedSampleId,
  maskingState,
  onSelectSample,
  onCustomImageUploaded,
  onSampleColorPicked,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [compareMode, setCompareMode] = useState<CompareMode>('split');
  const [splitPos, setSplitPos] = useState<number>(50); // 0 to 100%
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 2 = 200%
  const [isEyeDropperActive, setIsEyeDropperActive] = useState<boolean>(false);
  const [isHoldingBefore, setIsHoldingBefore] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Current active image URL
  const activeImage = sampleImages.find((img) => img.id === selectedSampleId) || sampleImages[0];

  // Load image into offscreen source canvas
  useEffect(() => {
    if (!activeImage) return;
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeImage.url;

    img.onload = () => {
      // Create or resize source canvas
      if (!sourceCanvasRef.current) {
        sourceCanvasRef.current = document.createElement('canvas');
      }
      if (!processedCanvasRef.current) {
        processedCanvasRef.current = document.createElement('canvas');
      }

      // Limit max dimension for fast interactive processing
      const maxDim = 1400;
      let w = img.naturalWidth || 800;
      let h = img.naturalHeight || 1000;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      sourceCanvasRef.current.width = w;
      sourceCanvasRef.current.height = h;
      processedCanvasRef.current.width = w;
      processedCanvasRef.current.height = h;

      const sCtx = sourceCanvasRef.current.getContext('2d', { willReadFrequently: true });
      if (sCtx) {
        sCtx.drawImage(img, 0, 0, w, h);
      }

      setImageLoaded(true);
    };
  }, [activeImage?.url]);

  const rafRef = useRef<number | null>(null);

  // Draw onto the visible viewport canvas according to compareMode and split position
  const drawDisplayCanvas = useCallback(() => {
    const display = displayCanvasRef.current;
    const src = sourceCanvasRef.current;
    const proc = processedCanvasRef.current;
    if (!display || !src || !proc) return;

    // Guard against repeated width/height assignment to avoid resetting canvas state and GPU texture reallocation
    if (display.width !== src.width) display.width = src.width;
    if (display.height !== src.height) display.height = src.height;

    const ctx = display.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, display.width, display.height);

    if (isHoldingBefore) {
      // Show original 100%
      ctx.drawImage(src, 0, 0);
      return;
    }

    if (compareMode === 'split') {
      // Draw Processed base
      ctx.drawImage(proc, 0, 0);

      // Clip Original on the left
      const splitX = (splitPos / 100) * display.width;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, display.height);
      ctx.clip();
      ctx.drawImage(src, 0, 0);
      ctx.restore();

      // Draw vertical separator line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, display.height);
      ctx.stroke();
    } else if (compareMode === 'side-by-side') {
      // In side by side mode display shows processed (handled in UI via dual canvas or combined)
      ctx.drawImage(proc, 0, 0);
    } else {
      // Toggle mode
      ctx.drawImage(proc, 0, 0);
    }
  }, [compareMode, splitPos, isHoldingBefore]);

  // Re-run pipeline when settings, maskingState or image change (throttled with rAF for 60fps responsiveness)
  const renderPipeline = useCallback(() => {
    if (!sourceCanvasRef.current || !processedCanvasRef.current || !imageLoaded) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setIsProcessing(true);
      // Apply filters with localized AI masking
      applyRetouchPipeline(sourceCanvasRef.current!, processedCanvasRef.current!, settings, maskingState);

      // Render onto display canvas
      drawDisplayCanvas();
      setIsProcessing(false);
      rafRef.current = null;
    });
  }, [settings, imageLoaded, maskingState, drawDisplayCanvas]);

  useEffect(() => {
    renderPipeline();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [renderPipeline]);

  useEffect(() => {
    drawDisplayCanvas();
  }, [drawDisplayCanvas, splitPos, compareMode, isHoldingBefore]);

  // Handle Dragging Split Slider
  const handleMouseDown = (e: React.MouseEvent) => {
    if (compareMode !== 'split') return;
    setIsDraggingSplit(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPos(percent);
  };

  const handleMouseUp = () => {
    setIsDraggingSplit(false);
  };

  // Canvas Click for Eyedropper
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyeDropperActive || !processedCanvasRef.current || !onSampleColorPicked) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const metrics = analyzeSkinToneMetrics(processedCanvasRef.current, clickX, clickY);
    onSampleColorPicked(metrics);
    setIsEyeDropperActive(false);
  };

  // Handle Local Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onCustomImageUploaded(url);
    }
  };

  return (
    <div
      className="relative flex-1 h-full flex flex-col bg-[#141417] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Viewport Top Control Bar */}
      <div className="h-10 px-4 bg-[#1a1a20] border-b border-neutral-800 flex items-center justify-between z-10">
        {/* Sample Image Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-400 hidden sm:inline">Ảnh mẫu:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {sampleImages.map((img) => (
              <button
                key={img.id}
                onClick={() => onSelectSample(img.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  selectedSampleId === img.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {img.name}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded cursor-pointer transition-colors whitespace-nowrap">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tải Ảnh Lên</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Comparison & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          {/* Eyedropper button */}
          <button
            onClick={() => setIsEyeDropperActive(!isEyeDropperActive)}
            title="Công cụ hút điểm màu da để đo CMYK"
            className={`p-1.5 rounded transition-colors ${
              isEyeDropperActive
                ? 'bg-amber-500 text-black'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Pipette className="w-4 h-4" />
          </button>

          {/* Compare Modes */}
          <div className="flex items-center bg-neutral-900 rounded p-0.5 border border-neutral-800">
            <button
              onClick={() => setCompareMode('split')}
              title="So sánh thanh trượt trước/sau"
              className={`p-1 rounded text-xs transition-colors ${
                compareMode === 'split'
                  ? 'bg-[#2b2b34] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCompareMode('side-by-side')}
              title="Xem song song 2 ảnh"
              className={`p-1 rounded text-xs transition-colors ${
                compareMode === 'side-by-side'
                  ? 'bg-[#2b2b34] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hold to view before */}
          <button
            onMouseDown={() => setIsHoldingBefore(true)}
            onMouseUp={() => setIsHoldingBefore(false)}
            onMouseLeave={() => setIsHoldingBefore(false)}
            title="Nhấn giữ chuột để xem lại ảnh gốc ban đầu"
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              isHoldingBefore
                ? 'bg-amber-500 text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Giữ xem Gốc</span>
            </span>
          </button>

          {/* Zoom Toggles */}
          <div className="flex items-center bg-neutral-900 rounded p-0.5 border border-neutral-800">
            <button
              onClick={() => setZoomLevel(1)}
              className={`px-2 py-0.5 text-xs font-mono rounded ${
                zoomLevel === 1 ? 'bg-[#2b2b34] text-white' : 'text-neutral-400'
              }`}
            >
              Fit
            </button>
            <button
              onClick={() => setZoomLevel(2)}
              title="Phóng to 200% soi vân chân lông"
              className={`px-2 py-0.5 text-xs font-mono rounded ${
                zoomLevel === 2 ? 'bg-[#2b2b34] text-indigo-300' : 'text-neutral-400'
              }`}
            >
              200%
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto flex items-center justify-center p-4 bg-[#111114]"
      >
        {!imageLoaded && (
          <div className="flex flex-col items-center gap-2 text-neutral-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Đang tải hình ảnh độ phân giải cao...</span>
          </div>
        )}

        {/* Side-by-side mode view */}
        {imageLoaded && compareMode === 'side-by-side' ? (
          <div className="flex items-center gap-4 max-w-full max-h-full">
            {/* Original Box */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative border border-neutral-800 rounded bg-black/40 overflow-hidden shadow-lg">
                <canvas
                  ref={(node) => {
                    if (node && sourceCanvasRef.current) {
                      node.width = sourceCanvasRef.current.width;
                      node.height = sourceCanvasRef.current.height;
                      const ctx = node.getContext('2d');
                      if (ctx) ctx.drawImage(sourceCanvasRef.current, 0, 0);
                    }
                  }}
                  style={{
                    maxHeight: zoomLevel === 1 ? '70vh' : '140vh',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-neutral-300 text-[10px] font-semibold rounded uppercase tracking-wider">
                  Trước (Original)
                </div>
              </div>
            </div>

            {/* Retouched Box */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative border border-indigo-900/60 rounded bg-black/40 overflow-hidden shadow-lg">
                <canvas
                  ref={displayCanvasRef}
                  onClick={handleCanvasClick}
                  style={{
                    maxHeight: zoomLevel === 1 ? '70vh' : '140vh',
                    width: 'auto',
                    objectFit: 'contain',
                    cursor: isEyeDropperActive ? 'crosshair' : 'default',
                  }}
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-600/90 text-white text-[10px] font-semibold rounded uppercase tracking-wider">
                  Sau (Retouched)
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Split slider or single canvas mode */
          <div
            className="relative border border-neutral-800/80 rounded bg-black/40 overflow-hidden shadow-2xl"
            onMouseDown={handleMouseDown}
          >
            <canvas
              ref={displayCanvasRef}
              onClick={handleCanvasClick}
              style={{
                maxHeight: zoomLevel === 1 ? '76vh' : '150vh',
                width: 'auto',
                objectFit: 'contain',
                cursor: isEyeDropperActive
                  ? 'crosshair'
                  : compareMode === 'split'
                  ? 'ew-resize'
                  : 'default',
              }}
            />

            {/* Split Comparison Indicators */}
            {compareMode === 'split' && (
              <>
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/75 backdrop-blur-sm text-neutral-200 text-[10px] font-semibold tracking-wider rounded pointer-events-none border border-neutral-700/50">
                  TRƯỚC (GỐC)
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 bg-indigo-600/80 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wider rounded pointer-events-none border border-indigo-400/30">
                  SAU (RETOUCH)
                </div>

                {/* Split Handle Visual Pill */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `calc(${splitPos}% - 14px)` }}
                >
                  <div className="w-7 h-7 rounded-full bg-white text-neutral-900 shadow-xl flex items-center justify-center border-2 border-indigo-600 text-[10px] font-bold">
                    ↔
                  </div>
                </div>
              </>
            )}

            {isHoldingBefore && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded shadow-lg">
                ĐANG HIỂN THỊ ẢNH GỐC
              </div>
            )}
          </div>
        )}
      </div>

      {/* Eyedropper Instruction Bar */}
      {isEyeDropperActive && (
        <div className="h-8 px-4 bg-amber-500 text-black text-xs font-semibold flex items-center justify-between shrink-0">
          <span>🎯 Bấm vào bất kỳ điểm nào trên khuôn mặt để đo tỷ lệ CMYK chuẩn...</span>
          <button
            onClick={() => setIsEyeDropperActive(false)}
            className="text-xs underline hover:text-neutral-900"
          >
            Hủy đo
          </button>
        </div>
      )}
    </div>
  );
};
