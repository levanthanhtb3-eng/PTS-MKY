import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Thao Tác Retouch Da & Khối',
      items: [
        { key: 'Ctrl + Z', description: 'Hoàn tác thay đổi vừa thực hiện (Undo)' },
        { key: 'Ctrl + Shift + Z', description: 'Làm lại thay đổi vừa hoàn tác (Redo)' },
        { key: 'A', description: 'Tự động phân tích độ nét ảnh & tối ưu High Pass (Auto-Sharpen)' },
        { key: 'F', description: 'Bật / Tắt Tách Tần Số (Frequency Separation)' },
        { key: 'D', description: 'Bật / Tắt Đánh Khối (Dodge & Burn)' },
        { key: 'V', description: 'Bật / Tắt Lớp Hỗ Trợ Soi Da (Visual Aid Solar Curve)' },
        { key: 'R', description: 'Khôi phục thông số Retouch mặc định' },
      ],
    },
    {
      title: 'Phím Tắt 1-Chạm Áp Dụng Presets',
      items: [
        { key: '1', description: 'Áp dụng nhanh Preset: Mịn Da Tự Nhiên' },
        { key: '2', description: 'Áp dụng nhanh Preset: Căng Bóng Glam' },
        { key: '3', description: 'Áp dụng nhanh Preset: Thời Trang Tạp Chí' },
      ],
    },
    {
      title: 'Mở Bảng Điều Khiển & Công Cụ',
      items: [
        { key: 'B', description: 'Mở cửa sổ Xử Lý Hàng Loạt (Batch Process)' },
        { key: 'C', description: 'Mở bảng Phân Tích Màu Da CMYK' },
        { key: 'S', description: 'Mở kho Script Photoshop ExtendScript (.jsx)' },
        { key: 'Tab', description: 'Chuyển đổi giao diện Photoshop CC / Toàn màn hình' },
        { key: '?', description: 'Mở bảng danh sách phím tắt này' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#1f1f26] border border-neutral-700/80 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#25252e] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-md border border-indigo-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Phím Tắt Nhanh (Keyboard Shortcuts)
              </h2>
              <p className="text-[11px] text-neutral-400">
                Tối ưu tốc độ thao tác chỉnh sửa da và màu sắc như Photoshop chuyên nghiệp
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

        {/* Shortcuts Groups */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="bg-[#17171d] rounded-lg border border-neutral-800 divide-y divide-neutral-800/60 overflow-hidden">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#202028]/60 transition-colors"
                  >
                    <span className="text-neutral-300">{item.description}</span>
                    <kbd className="px-2 py-0.5 bg-[#2b2b34] border border-neutral-700 text-neutral-200 font-mono text-[11px] font-semibold rounded shadow-sm">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#1a1a22] border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span>💡 Phím tắt hoạt động khi không ở trong ô nhập liệu.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
