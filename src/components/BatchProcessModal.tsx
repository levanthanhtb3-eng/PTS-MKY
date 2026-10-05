import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Play,
  Download,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Layers,
  Sparkles,
  Archive,
  RefreshCw,
  Trash2,
  Eye,
  Sliders,
  FileCode
} from 'lucide-react';
import JSZip from 'jszip';
import { RetouchSettings, SampleImage } from '../types/retouch';
import { applyRetouchPipeline } from '../utils/canvasFilters';
import { SKIN_TONE_PRESETS } from '../data/photoshopScripts';

export interface BatchItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  width?: number;
  height?: number;
  originalUrl: string;
  processedUrl?: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress?: number;
  errorMessage?: string;
}

interface BatchProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RetouchSettings;
  sampleImages: SampleImage[];
  onOpenScripts?: (scriptId?: string) => void;
}

export const BatchProcessModal: React.FC<BatchProcessModalProps> = ({
  isOpen,
  onClose,
  settings,
  sampleImages,
  onOpenScripts,
}) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [maxDimension, setMaxDimension] = useState<number>(0); // 0 = original, 2048 = web max
  const [previewItem, setPreviewItem] = useState<BatchItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Active Preset name for display
  const activePreset =
    SKIN_TONE_PRESETS.find((p) => p.id === settings.skinTonePreset) || SKIN_TONE_PRESETS[0];

  // Add files from local disk
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: BatchItem[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newItems.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          originalUrl: url,
          status: 'idle',
        });
      }
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  // Add sample photos for quick demo
  const handleAddSamplePhotos = () => {
    const sampleItems: BatchItem[] = sampleImages.map((s, idx) => ({
      id: `sample_${Date.now()}_${idx}`,
      name: `${s.name}.jpg`,
      size: 450000,
      originalUrl: s.url,
      status: 'idle',
    }));
    setItems((prev) => [...prev, ...sampleItems]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
  };

  const handleClearAll = () => {
    setItems([]);
    setProcessedCount(0);
    setPreviewItem(null);
  };

  // Run the batch retouch process
  const startBatchProcess = async () => {
    if (items.length === 0 || isProcessing) return;

    setIsProcessing(true);
    let completed = 0;

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      if (currentItem.status === 'done') {
        completed++;
        continue;
      }

      // Update current item status to processing
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing', progress: 30 } : item
        )
      );

      try {
        const processedBlobUrl = await processSingleImage(currentItem.originalUrl);
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'done',
                  progress: 100,
                  processedUrl: processedBlobUrl,
                }
              : item
          )
        );
        completed++;
        setProcessedCount(completed);
      } catch (err) {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'error',
                  errorMessage: 'Lỗi trong quá trình xử lý ảnh',
                }
              : item
          )
        );
      }
    }

    setIsProcessing(false);
  };

  // Process a single image URL through the Canvas pipeline
  const processSingleImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;

      img.onload = () => {
        try {
          const srcCanvas = document.createElement('canvas');
          const targetCanvas = document.createElement('canvas');

          let w = img.naturalWidth || 1200;
          let h = img.naturalHeight || 1600;

          // Resize if maxDimension specified
          if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
            if (w > h) {
              h = Math.round((h * maxDimension) / w);
              w = maxDimension;
            } else {
              w = Math.round((w * maxDimension) / h);
              h = maxDimension;
            }
          }

          srcCanvas.width = w;
          srcCanvas.height = h;
          targetCanvas.width = w;
          targetCanvas.height = h;

          const sCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
          if (!sCtx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          sCtx.drawImage(img, 0, 0, w, h);

          // Apply current retouch pipeline
          applyRetouchPipeline(srcCanvas, targetCanvas, settings);

          const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
          const quality = exportFormat === 'png' ? 1.0 : 0.95;

          targetCanvas.toBlob(
            (blob) => {
              if (blob) {
                const resultUrl = URL.createObjectURL(blob);
                resolve(resultUrl);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            mimeType,
            quality
          );
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    });
  };

  // Download all completed images as a ZIP file
  const handleDownloadZip = async () => {
    const doneItems = items.filter((item) => item.status === 'done' && item.processedUrl);
    if (doneItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('Lumina_Retouched_Batch');

      for (let i = 0; i < doneItems.length; i++) {
        const item = doneItems[i];
        if (!item.processedUrl) continue;

        const response = await fetch(item.processedUrl);
        const blob = await response.blob();
        const ext = exportFormat === 'png' ? 'png' : 'jpg';
        const cleanName = item.name.replace(/\.[^/.]+$/, '');
        folder?.file(`${cleanName}_Retouched.${ext}`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Lumina_Retouch_Batch_${doneItems.length}_photos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSingle = (item: BatchItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    const ext = exportFormat === 'png' ? 'png' : 'jpg';
    link.href = item.processedUrl;
    link.download = `Retouched_${item.name.replace(/\.[^/.]+$/, '')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalProgress = items.length > 0 ? Math.round((processedCount / items.length) * 100) : 0;
  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#1f1f26] border border-neutral-700/80 rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden text-neutral-200">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#25252e] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-md border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Retouch Hàng Loạt (Batch Processing)
              </h2>
              <p className="text-[11px] text-neutral-400">
                Áp dụng toàn bộ thông số Retouch &amp; Tone màu hiện tại lên nhiều bức ảnh cùng lúc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Applied Settings Summary Bar */}
        <div className="px-5 py-2.5 bg-[#1a1a20] border-b border-neutral-800 flex items-center justify-between text-xs flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-3 text-[11px] text-neutral-300 overflow-x-auto py-0.5">
            <span className="font-semibold text-indigo-400 flex items-center gap-1 shrink-0">
              <Sliders className="w-3.5 h-3.5" />
              <span>Thông số áp dụng:</span>
            </span>
            <span className="shrink-0">
              Tách tần số: <strong className="text-white">{settings.fsRadius}px</strong> (Mịn {settings.fsSmoothness}%, Vân {settings.fsTextureSharpness}%)
            </span>
            <span className="text-neutral-600">·</span>
            <span className="shrink-0">
              Đánh khối: <strong className="text-white">{settings.dbIntensity}%</strong> (T-Zone {settings.dbContourTZone}%)
            </span>
            <span className="text-neutral-600">·</span>
            <span className="shrink-0 flex items-center gap-1">
              Tone: <strong className="text-white">{activePreset.name}</strong>
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
                style={{ backgroundColor: activePreset.hex }}
              />
            </span>
            <span className="text-neutral-600">·</span>
            <span className="shrink-0">
              High Pass: <strong className="text-white">{settings.highPassSharpen}%</strong>
            </span>
          </div>

          {onOpenScripts && (
            <button
              onClick={() => onOpenScripts('batch_folder')}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Script Folder Photoshop (.jsx)</span>
            </button>
          )}
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Drag & Drop Area and Queue List */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
            {/* Top action row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilesAdded(e.target.files)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn Ảnh Từ Máy</span>
                </button>
                <button
                  onClick={handleAddSamplePhotos}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white rounded-md text-xs font-medium transition-colors"
                >
                  + Thêm 3 Ảnh Mẫu Studio
                </button>
              </div>

              {items.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-400 font-mono tabular-nums">
                    {doneCount} / {items.length} ảnh hoàn thành
                  </span>
                  <button
                    onClick={handleClearAll}
                    disabled={isProcessing}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
                    title="Xóa danh sách"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Empty State / Dropzone */}
            {items.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesAdded(e.dataTransfer.files);
                }}
                className="flex-1 border-2 border-dashed border-neutral-700 hover:border-indigo-500/80 bg-[#17171d]/60 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-indigo-600/20 text-neutral-400 group-hover:text-indigo-400 flex items-center justify-center mb-3 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200 mb-1">
                  Kéo thả ảnh vào đây hoặc bấm để chọn từ máy tính
                </h3>
                <p className="text-xs text-neutral-400 max-w-md">
                  Hỗ trợ định dạng JPG, PNG, WebP. Hệ thống sẽ tự động áp dụng tách tần số làm mịn da và cân màu da đồng loạt.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSamplePhotos();
                    }}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-md border border-neutral-700 transition-colors"
                  >
                    Dùng thử với bộ 3 ảnh chân dung mẫu
                  </button>
                </div>
              </div>
            ) : (
              /* Populated Items Table */
              <div className="flex-1 bg-[#17171d] rounded-xl border border-neutral-800 overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="h-8 bg-[#202028] px-3 border-b border-neutral-800 flex items-center text-[11px] font-semibold text-neutral-400 select-none">
                  <span className="w-12 text-center">Ảnh</span>
                  <span className="flex-1 px-2">Tên Tệp Tin</span>
                  <span className="w-24 text-right">Dung Lượng</span>
                  <span className="w-32 text-center">Trạng Thái</span>
                  <span className="w-24 text-right">Hành Động</span>
                </div>

                {/* Items Scrollable List */}
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 p-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className={`flex items-center px-2 py-2 rounded-lg text-xs hover:bg-[#202028]/70 cursor-pointer transition-colors ${
                        previewItem?.id === item.id ? 'bg-[#242430] ring-1 ring-indigo-500/40' : ''
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded overflow-hidden bg-black/60 shrink-0 border border-neutral-800 relative">
                        <img
                          src={item.processedUrl || item.originalUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {item.status === 'done' && (
                          <div className="absolute bottom-0 right-0 p-0.5 bg-emerald-500 text-black rounded-tl">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 px-3 min-w-0">
                        <div className="font-medium text-neutral-200 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {item.status === 'done'
                            ? '✓ Đã hoàn tất Retouch da & màu'
                            : item.status === 'processing'
                            ? 'Đang tính toán Tách tần số...'
                            : 'Đang chờ xử lý'}
                        </div>
                      </div>

                      {/* Size */}
                      <div className="w-24 text-right font-mono text-[11px] text-neutral-400 tabular-nums">
                        {formatFileSize(item.size)}
                      </div>

                      {/* Status */}
                      <div className="w-32 text-center px-2">
                        {item.status === 'idle' && (
                          <span className="text-[11px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded">
                            Chờ lệnh
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="text-[11px] text-sky-400 flex items-center justify-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Đang làm...</span>
                          </span>
                        )}
                        {item.status === 'done' && (
                          <span className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Xong</span>
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-[11px] text-rose-400 flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Lỗi</span>
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="w-24 flex items-center justify-end gap-1">
                        {item.status === 'done' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSingle(item);
                            }}
                            title="Tải ảnh này về máy"
                            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          disabled={isProcessing}
                          title="Xóa khỏi hàng đợi"
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview & Batch Controls Sidebar */}
          <div className="w-80 md:w-88 bg-[#1a1a20] border-l border-neutral-800 flex flex-col overflow-y-auto p-4 space-y-4 shrink-0">
            {/* Preview Box */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Xem Trước Kết Quả</span>
                </span>
                {previewItem && (
                  <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[120px]">
                    {previewItem.name}
                  </span>
                )}
              </div>

              <div className="h-56 bg-black/60 rounded-lg border border-neutral-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                {previewItem ? (
                  <>
                    <img
                      src={previewItem.processedUrl || previewItem.originalUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/75 backdrop-blur-sm text-[10px] font-semibold rounded text-white border border-neutral-700/60">
                      {previewItem.processedUrl ? 'ĐÃ RETOUCH' : 'ẢNH GỐC'}
                    </div>
                  </>
                ) : items.length > 0 ? (
                  <div className="text-center p-4 text-xs text-neutral-400">
                    Bấm vào một bức ảnh trong danh sách bên trái để soi chi tiết trước/sau
                  </div>
                ) : (
                  <div className="text-center p-4 text-xs text-neutral-500">
                    Chưa có ảnh nào trong hàng đợi
                  </div>
                )}
              </div>
            </div>

            {/* Export Settings */}
            <div className="space-y-3 bg-[#202028] p-3 rounded-lg border border-neutral-800 text-xs">
              <div className="font-semibold text-neutral-200">Tùy Chọn Xuất Tệp:</div>

              {/* Format selection */}
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Định dạng xuất file:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setExportFormat('jpeg')}
                    className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                      exportFormat === 'jpeg'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    JPEG (Chất lượng 95%)
                  </button>
                  <button
                    onClick={() => setExportFormat('png')}
                    className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                      exportFormat === 'png'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    PNG (Không nén)
                  </button>
                </div>
              </div>

              {/* Resolution resize */}
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Độ phân giải tối đa:
                </label>
                <select
                  value={maxDimension}
                  onChange={(e) => setMaxDimension(parseInt(e.target.value))}
                  className="w-full bg-[#181820] border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>Giữ nguyên kích thước gốc (Gốc 100%)</option>
                  <option value={2048}>Chuẩn Mạng Xã Hội (Cạnh dài max 2048px)</option>
                  <option value={1280}>Chuẩn Web Tối Ưu (Cạnh dài max 1280px)</option>
                </select>
              </div>
            </div>

            {/* Overall Progress Bar */}
            {isProcessing && (
              <div className="space-y-1.5 p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg">
                <div className="flex justify-between text-xs text-indigo-200">
                  <span>Tiến trình xử lý:</span>
                  <span className="font-mono tabular-nums font-semibold">{totalProgress}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="space-y-2 mt-auto pt-2">
              <button
                onClick={startBatchProcess}
                disabled={items.length === 0 || isProcessing}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang Retouch ({processedCount}/{items.length})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Bắt Đầu Retouch ({items.length} Ảnh)</span>
                  </>
                )}
              </button>

              {/* Download ZIP button */}
              <button
                onClick={handleDownloadZip}
                disabled={doneCount === 0 || isZipping || isProcessing}
                className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white disabled:opacity-40 disabled:hover:bg-neutral-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isZipping ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>Đang nén file ZIP...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tải Tất Cả File Nén (.ZIP - {doneCount} ảnh)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-[#1a1a20] border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mẹo: Bạn có thể chọn hàng chục ảnh chân dung cùng lúc để áp dụng cùng một tone màu chuẩn.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
