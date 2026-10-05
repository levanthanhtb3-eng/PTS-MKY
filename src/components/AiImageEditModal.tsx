import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  ArrowRight,
  Eye,
  Sliders,
  Layers,
  ChevronRight,
  PlusCircle
} from 'lucide-react';

interface AiImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageSrc?: string;
  onApplyResultImage: (newImageUrl: string, name?: string) => void;
}

export const AiImageEditModal: React.FC<AiImageEditModalProps> = ({
  isOpen,
  onClose,
  currentImageSrc,
  onApplyResultImage,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'create'>('edit');
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'3:4' | '1:1' | '16:9'>('3:4');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.1-flash-image-preview');
  const [compareSplit, setCompareSplit] = useState<number>(50);

  if (!isOpen) return null;

  // Preset prompt suggestions for retouching
  const editPromptPresets = [
    {
      label: 'Khử mụn & Giữ vân da thật',
      prompt: 'Xóa sạch mụn thâm và vết đỏ trên da mặt, làm đều màu da tự nhiên nhưng giữ nguyên 100% kết cấu vân da và lỗ chân lông thật.',
    },
    {
      label: 'Ánh sáng Golden Hour & Glass Skin',
      prompt: 'Thêm ánh sáng hoàng hôn ấm áp rọi nhẹ một bên gò má, tạo hiệu ứng da căng bóng ngậm nước Glass Skin trong suốt.',
    },
    {
      label: 'Làm sáng mắt & Xóa bọng mắt',
      prompt: 'Xóa quầng thâm và bọng mệt mỏi dưới mắt, tăng độ tương phản tròng mắt và thêm điểm bắt sáng catchlight long lanh.',
    },
    {
      label: 'Tẩy trắng răng & Hồng môi',
      prompt: 'Khử vàng răng tự nhiên để răng trắng sáng rạng rỡ, tô son hồng đào nhẹ nhàng tươi tắn.',
    },
    {
      label: 'Thay phông Studio Bokeh',
      prompt: 'Giữ nguyên người mẫu, làm mờ hậu cảnh phía sau thành phông studio tối màu với ánh sáng bokeh tròn nghệ thuật.',
    },
  ];

  // Preset prompts for creating new portraits
  const createPromptPresets = [
    {
      label: 'Mẫu Á Đông Beauty Close-up',
      prompt: 'Chân dung cận cảnh khuôn mặt cô gái Á Đông với làn da trắng hồng trong veo, ánh mắt hút hồn, ánh sáng studio softbox mềm mại.',
    },
    {
      label: 'Nam Doanh Nhân Lịch Lãm',
      prompt: 'Chân dung bán thân người đàn ông châu Á mặc suit đen sang trọng, ánh sáng khối Rembrandt tương phản sắc nét, thần thái tự tin.',
    },
    {
      label: 'Thời Trang Tạp Chí Editorial',
      prompt: 'Chụp chân dung nghệ thuật thời trang phong cách bìa tạp chí Harper\'s Bazaar, ánh sáng ấn tượng, trang điểm sắc sảo.',
    },
  ];

  const handleRunAi = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Vui lòng nhập câu lệnh prompt mô tả nội dung bạn muốn AI thực hiện.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'edit') {
        if (!currentImageSrc) {
          throw new Error('Chưa có ảnh chân dung nguồn để chỉnh sửa.');
        }

        // Convert current image src to base64 if needed
        let base64Data = currentImageSrc;
        if (!currentImageSrc.startsWith('data:')) {
          base64Data = await convertUrlToBase64(currentImageSrc);
        }

        const res = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            imageBase64: base64Data,
            mimeType: 'image/jpeg',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Lỗi khi gọi mô hình Gemini AI.');
        }

        setResultImage(data.imageUrl);
        if (data.modelUsed) setModelUsed(data.modelUsed);
      } else {
        // Create new image
        const res = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            aspectRatio,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Lỗi khi tạo ảnh với Gemini AI.');
        }

        setResultImage(data.imageUrl);
        if (data.modelUsed) setModelUsed(data.modelUsed);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Đã xảy ra lỗi trong quá trình xử lý hình ảnh với AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const convertUrlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1024;
        canvas.height = img.naturalHeight || 1365;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => reject(new Error('Không thể tải ảnh nguồn để xử lý base64'));
    });
  };

  const handleApplyToStudio = () => {
    if (!resultImage) return;
    onApplyResultImage(resultImage, `AI_${activeTab === 'edit' ? 'Edited' : 'Generated'}_Portrait`);
    onClose();
  };

  const handleDownloadResult = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `Lumina_AI_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#1f1f26] border border-neutral-700/80 rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden text-neutral-200">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#25252e] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-rose-500 text-white rounded-md shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">
                  Sửa Chữa &amp; Tạo Ảnh Bằng AI (Gemini Studio)
                </h2>
                <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] rounded">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Chỉnh sửa khuyết điểm chân dung, thay đổi ánh sáng hoặc tạo mới bằng ngôn ngữ tự nhiên
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

        {/* Mode Selector Tabs */}
        <div className="px-5 py-2 bg-[#1a1a20] border-b border-neutral-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('edit');
              setPrompt('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'edit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Sửa Chữa Chân Dung Hiện Tại (Edit Portrait)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setPrompt('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Tạo Mới Từ Mô Tả (Generate New)</span>
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Input & Prompt Engineering Panel */}
          <div className="w-full md:w-1/2 flex flex-col p-4 border-r border-neutral-800 overflow-y-auto space-y-4">
            {/* Context preview for Edit mode */}
            {activeTab === 'edit' && currentImageSrc && (
              <div className="p-2.5 bg-[#17171d] rounded-lg border border-neutral-800 flex items-center gap-3">
                <div className="w-14 h-14 rounded-md overflow-hidden bg-black/60 shrink-0 border border-neutral-700">
                  <img
                    src={currentImageSrc}
                    alt="Source"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-200 truncate">
                    Ảnh chân dung đang mở
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    AI sẽ đọc nhận diện khuôn mặt và áp dụng câu lệnh sửa chữa trực tiếp lên ảnh này
                  </div>
                </div>
              </div>
            )}

            {/* Quick Prompt Suggestions */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-300 block mb-1.5">
                Gợi ý câu lệnh nhanh (Click để chọn):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(activeTab === 'edit' ? editPromptPresets : createPromptPresets).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(preset.prompt)}
                    className="px-2.5 py-1 bg-[#23232c] hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-neutral-700/80 text-neutral-300 hover:text-white rounded-md text-[11px] transition-colors text-left"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Prompt */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
                <span>Câu lệnh mô tả chi tiết:</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  Hỗ trợ cả tiếng Việt và tiếng Anh
                </span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  activeTab === 'edit'
                    ? 'Ví dụ: "Làm mịn đều màu da, xóa mụn đỏ ở cằm, thêm điểm sáng long lanh trong mắt, giữ nguyên vân da chân thật và không làm biến dạng khuôn mặt"...'
                    : 'Ví dụ: "Chân dung studio nghệ thuật cô gái Á Đông với làn da căng bóng mịn màng, góc chụp chính diện 85mm, ánh sáng dịu nhẹ"...'
                }
                rows={4}
                className="w-full flex-1 bg-[#17171d] border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Aspect ratio for Create mode */}
            {activeTab === 'create' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 block">
                  Tỷ lệ khung hình:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('3:4')}
                    className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                      aspectRatio === '3:4'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-[#1a1a20] border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    3:4 (Chân dung)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('1:1')}
                    className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                      aspectRatio === '1:1'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-[#1a1a20] border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    1:1 (Vuông)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                      aspectRatio === '16:9'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-[#1a1a20] border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    16:9 (Toàn cảnh)
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Generate Trigger Button */}
            <button
              onClick={handleRunAi}
              disabled={isLoading || !prompt.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Đang Tính Toán &amp; Tái Tạo Ảnh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {activeTab === 'edit'
                      ? 'Thực Thi Chỉnh Sửa Bằng AI'
                      : 'Tạo Ảnh Chân Dung Mới'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right: Real-time Result & Comparison View */}
          <div className="w-full md:w-1/2 flex flex-col p-4 bg-[#17171d] overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Xem Trước Kết Quả AI</span>
              </span>
              {resultImage && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hoàn tất ({modelUsed})</span>
                </span>
              )}
            </div>

            {/* Visual Canvas / Preview Box */}
            <div className="flex-1 bg-black/70 rounded-xl border border-neutral-800 overflow-hidden relative flex items-center justify-center shadow-inner">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-200">
                      Đang xử lý với Gemini 3.1 Flash Image...
                    </h4>
                    <p className="text-xs text-neutral-400 max-w-xs mt-1">
                      Mô hình đang phân tích kết cấu khuôn mặt và tái cấu trúc điểm ảnh theo câu lệnh prompt của bạn.
                    </p>
                  </div>
                </div>
              ) : resultImage ? (
                /* Interactive Before / After Split Slider or Result Image */
                activeTab === 'edit' && currentImageSrc ? (
                  <div className="relative w-full h-full select-none overflow-hidden group">
                    {/* After Image (Full width background) */}
                    <img
                      src={resultImage}
                      alt="AI Result"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* Before Image (Clipped on left) */}
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ clipPath: `inset(0 ${100 - compareSplit}% 0 0)` }}
                    >
                      <img
                        src={currentImageSrc}
                        alt="Original"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>

                    {/* Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] z-10 pointer-events-none"
                      style={{ left: `${compareSplit}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-black shadow-lg flex items-center justify-center text-[10px] font-bold">
                        ↔
                      </div>
                    </div>

                    {/* Range input slider */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={compareSplit}
                      onChange={(e) => setCompareSplit(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/75 backdrop-blur-md rounded text-[10px] font-semibold text-white border border-neutral-700/60 pointer-events-none">
                      ẢNH GỐC
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600/85 backdrop-blur-md rounded text-[10px] font-semibold text-white border border-indigo-400/40 pointer-events-none flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>AI ĐÃ SỬA</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-2">
                    <img
                      src={resultImage}
                      alt="AI Generated"
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-500">
                  <div className="w-12 h-12 rounded-full bg-neutral-800/80 flex items-center justify-center mb-2">
                    <Sparkles className="w-6 h-6 text-neutral-600" />
                  </div>
                  <div className="text-xs font-semibold text-neutral-300">
                    Chưa có ảnh kết quả
                  </div>
                  <p className="text-[11px] text-neutral-500 max-w-xs mt-0.5">
                    Nhập câu lệnh prompt ở cột bên trái và bấm thực thi để AI bắt đầu sửa chữa hoặc tạo ảnh.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions for Generated Result */}
            {resultImage && (
              <div className="pt-3 flex items-center justify-between gap-2 shrink-0">
                <button
                  onClick={handleDownloadResult}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Về Máy</span>
                </button>

                <button
                  onClick={handleApplyToStudio}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Đưa Vào Studio Retouch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-[#1a1a20] border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Ảnh sau khi sửa đổi bằng AI có thể tiếp tục được làm mịn da bằng Tách tần số hoặc cân màu CMYK chuẩn Photoshop.
            </span>
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
