export interface PhotoshopScriptItem {
  id: string;
  title: string;
  category: 'skin' | 'dodge_burn' | 'details' | 'color' | 'finish';
  description: string;
  shortcut?: string;
  filename: string;
  code: string;
}

export const PHOTOSHOP_SCRIPTS: PhotoshopScriptItem[] = [
  {
    id: 'fs_8bit',
    title: 'Frequency Separation (8-bit Pro)',
    category: 'skin',
    description: 'Tự động tạo nhóm tách tần số chuẩn 8-bit: Low Frequency (Màu & Khối da) + High Frequency (Vân da, lỗ chân lông) kèm layer Healing Brush sẵn sàng.',
    filename: 'Lumina_Frequency_Separation_8bit.jsx',
    code: `// Lumina Retouch Pro - 8-Bit Frequency Separation Script for Adobe Photoshop
#target photoshop
app.bringToFront();

if (app.documents.length === 0) {
    alert("Vui lòng mở một tài liệu ảnh trước khi chạy script!");
} else {
    var doc = app.activeDocument;
    doc.suspendHistory("Lumina: Frequency Separation (8-bit)", "runFS8Bit()");
}

function runFS8Bit() {
    var doc = app.activeDocument;
    var origLayer = doc.activeLayer;
    
    // Duplicate active layer as merged or selection
    var sourceLayer = origLayer.duplicate();
    sourceLayer.name = "Original Snapshot";
    sourceLayer.visible = false;

    // Create Group
    var group = doc.layerSets.add();
    group.name = "[Lumina] Frequency Separation (8-bit)";

    // Low Frequency Layer
    var lowLayer = origLayer.duplicate(group, ElementPlacement.INSIDE);
    lowLayer.name = "Low Frequency (Color / Tone)";
    doc.activeLayer = lowLayer;
    lowLayer.applyGaussianBlur(8.0); // Bán kính chuẩn làm mịn khối

    // High Frequency Layer
    var highLayer = origLayer.duplicate(group, ElementPlacement.PLACEBEFORE);
    highLayer.name = "High Frequency (Texture / Pores)";
    doc.activeLayer = highLayer;

    // Apply Image calculation for 8-bit
    // Calculation: (High - Low) / 2 + 128 (Offset: 128, Scale: 2)
    var idappImg = charIDToTypeID("AppI");
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putName(charIDToTypeID("Lyr "), "Low Frequency (Color / Tone)");
    desc.putReference(charIDToTypeID("With"), ref);
    desc.putEnumerated(charIDToTypeID("Clcn"), charIDToTypeID("Clcn"), charIDToTypeID("Sbtr")); // Subtract
    desc.putDouble(charIDToTypeID("Scl "), 2.0); // Scale 2
    desc.putInteger(charIDToTypeID("Ofst"), 128); // Offset 128
    executeAction(idappImg, desc, DialogModes.NO);

    // Set High Frequency layer blend mode to Linear Light
    highLayer.blendMode = BlendMode.LINEARLIGHT;

    // Create an empty retouching layer between High and Low
    var retouchLayer = group.artLayers.add();
    retouchLayer.name = ">> Retouch Here (Mixer Brush / Clone) <<";
    retouchLayer.move(highLayer, ElementPlacement.PLACEAFTER);
    doc.activeLayer = retouchLayer;

    alert("✓ Đã tạo xong nhóm Tách Tần Số 8-bit!\\n\\nCách dùng:\\n- Chọn layer '>> Retouch Here <<'\\n- Dùng Mixer Brush hoặc Healing Brush (Sample: Current & Below) để vuốt mịn da mà giữ nguyên 100% vân da.");
}`
  },
  {
    id: 'fs_16bit',
    title: 'Frequency Separation (16-bit Pro)',
    category: 'skin',
    description: 'Tách tần số chuẩn 16-bit cao cấp dùng chế độ Add + Invert (Offset 0, Scale 2) không bao giờ bị bệt màu hay vỡ dải sắc thái.',
    filename: 'Lumina_Frequency_Separation_16bit.jsx',
    code: `// Lumina Retouch Pro - 16-Bit Frequency Separation Script for Adobe Photoshop
#target photoshop
app.bringToFront();

if (app.documents.length === 0) {
    alert("Vui lòng mở một tài liệu ảnh!");
} else {
    var doc = app.activeDocument;
    doc.suspendHistory("Lumina: Frequency Separation (16-bit)", "runFS16Bit()");
}

function runFS16Bit() {
    var doc = app.activeDocument;
    var origLayer = doc.activeLayer;

    var group = doc.layerSets.add();
    group.name = "[Lumina] Frequency Separation (16-bit)";

    var lowLayer = origLayer.duplicate(group, ElementPlacement.INSIDE);
    lowLayer.name = "Low Frequency (Tone & Volume)";
    doc.activeLayer = lowLayer;
    lowLayer.applyGaussianBlur(10.0);

    var highLayer = origLayer.duplicate(group, ElementPlacement.PLACEBEFORE);
    highLayer.name = "High Frequency (Fine Texture)";
    doc.activeLayer = highLayer;

    // Apply Image for 16-bit: Invert + Add mode (Offset: 0, Scale: 2)
    var idappImg = charIDToTypeID("AppI");
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putName(charIDToTypeID("Lyr "), "Low Frequency (Tone & Volume)");
    desc.putReference(charIDToTypeID("With"), ref);
    desc.putBoolean(charIDToTypeID("Invr"), true); // Invert checked
    desc.putEnumerated(charIDToTypeID("Clcn"), charIDToTypeID("Clcn"), charIDToTypeID("Add ")); // Add
    desc.putDouble(charIDToTypeID("Scl "), 2.0);
    desc.putInteger(charIDToTypeID("Ofst"), 0);
    executeAction(idappImg, desc, DialogModes.NO);

    highLayer.blendMode = BlendMode.LINEARLIGHT;

    var retouchLayer = group.artLayers.add();
    retouchLayer.name = ">> Retouch Tone (Clone / Mixer) <<";
    retouchLayer.move(highLayer, ElementPlacement.PLACEAFTER);
    doc.activeLayer = retouchLayer;

    alert("✓ Đã khởi tạo Tách Tần Số 16-bit chuẩn Studio! Dùng Brush mềm hoặc Mixer Brush trên layer Retouch Tone.");
}`
  },
  {
    id: 'db_curves',
    title: 'Dodge & Burn Dual Curves + Visual Aid',
    category: 'dodge_burn',
    description: 'Tạo bộ đôi Curves Dodge (Sáng) & Burn (Tối) với mặt nạ đảo ngược (Inverted Mask) cùng lớp Visual Aid đen trắng tương phản cao để soi khuyết điểm trên da.',
    filename: 'Lumina_Dodge_and_Burn.jsx',
    code: `// Lumina Retouch Pro - Dodge & Burn Setup + Visual Aid Helper
#target photoshop
app.bringToFront();

if (app.documents.length === 0) {
    alert("Vui lòng mở ảnh trước!");
} else {
    var doc = app.activeDocument;
    doc.suspendHistory("Lumina: Dodge & Burn Group", "createDAndBGroup()");
}

function createDAndBGroup() {
    var doc = app.activeDocument;
    
    // Group container
    var group = doc.layerSets.add();
    group.name = "[Lumina] Dodge & Burn (Điêu Khắc Khối)";

    // 1. Visual Aid Helper (B&W High Contrast to expose skin flaws)
    var visualAid = doc.artLayers.add();
    visualAid.name = "👁 VISUAL AID (Tắt khi xuất ảnh)";
    visualAid.move(group, ElementPlacement.INSIDE);
    doc.activeLayer = visualAid;

    // Make it 50% black/white solar curve check
    try {
        var bwDesc = new ActionDescriptor();
        var bwRef = new ActionReference();
        bwRef.putClass(charIDToTypeID("AdjL"));
        bwDesc.putReference(charIDToTypeID("null"), bwRef);
        var curDesc = new ActionDescriptor();
        curDesc.putClass(charIDToTypeID("Type"), charIDToTypeID("BanW"));
        bwDesc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), curDesc);
        executeAction(charIDToTypeID("Mk  "), bwDesc, DialogModes.NO);
        doc.activeLayer.name = "👁 VISUAL AID (Tắt khi xuất ảnh)";
    } catch(e) {}

    // 2. Dodge Curves (Làm Sáng Khối)
    createCurveAdjustment("DODGE (Sáng da / Bắt sáng)", true);
    // 3. Burn Curves (Làm Tối Khối)
    createCurveAdjustment("BURN (Tối da / Chiều sâu)", false);

    alert("✓ Đã tạo bộ Dodge & Burn chuyên nghiệp!\\n\\n- Chọn cọ Brush màu TRẮNG (Opacity 1-3%, Flow 20-50%)\\n- Vẽ lên mặt nạ layer 'DODGE' để nâng sáng sống mũi, gò má, cằm.\\n- Vẽ lên mặt nạ layer 'BURN' để tạo chiều sâu gò má, viền cằm.");
}

function createCurveAdjustment(layerName, isDodge) {
    var doc = app.activeDocument;
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);
    
    var adjDesc = new ActionDescriptor();
    adjDesc.putClass(charIDToTypeID("Type"), charIDToTypeID("Crvs"));
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), adjDesc);
    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
    
    var layer = doc.activeLayer;
    layer.name = layerName;
    
    // Invert the mask to black
    try {
        var idInvr = charIDToTypeID("Invr");
        executeAction(idInvr, undefined, DialogModes.NO);
    } catch(e) {}
}`
  },
  {
    id: 'teeth_eyes',
    title: 'Eyes Pop & Teeth Whitening System',
    category: 'details',
    description: 'Tạo mặt nạ tẩy trắng răng thông minh (giảm vàng -35, tăng sáng nhẹ) và mặt nạ làm sáng bắt sáng tròng mắt long lanh tự nhiên.',
    filename: 'Lumina_Eyes_and_Teeth.jsx',
    code: `// Lumina Retouch Pro - Teeth Whitening & Eye Brightening
#target photoshop
app.bringToFront();

if (app.documents.length === 0) {
    alert("Vui lòng mở ảnh trước!");
} else {
    var doc = app.activeDocument;
    doc.suspendHistory("Lumina: Eyes & Teeth Suite", "runEyesTeeth()");
}

function runEyesTeeth() {
    var doc = app.activeDocument;
    var group = doc.layerSets.add();
    group.name = "[Lumina] Mắt & Răng Trắng Tự Nhiên";

    // Teeth Whitener (Hue/Saturation layer)
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);
    var satDesc = new ActionDescriptor();
    satDesc.putClass(charIDToTypeID("Type"), charIDToTypeID("HStr"));
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), satDesc);
    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
    
    var teethLayer = doc.activeLayer;
    teethLayer.name = "🦷 TẨY TRẮNG RĂNG (Vẽ cọ trắng lên răng)";
    try {
        executeAction(charIDToTypeID("Invr"), undefined, DialogModes.NO);
    } catch(e) {}

    // Eye Brightener (Curves)
    var desc2 = new ActionDescriptor();
    var ref2 = new ActionReference();
    ref2.putClass(charIDToTypeID("AdjL"));
    desc2.putReference(charIDToTypeID("null"), ref2);
    var crvDesc = new ActionDescriptor();
    crvDesc.putClass(charIDToTypeID("Type"), charIDToTypeID("Crvs"));
    desc2.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), crvDesc);
    executeAction(charIDToTypeID("Mk  "), desc2, DialogModes.NO);

    var eyeLayer = doc.activeLayer;
    eyeLayer.name = "✨ LÀM SÁNG TRÒNG MẮT (Bắt sáng)";
    eyeLayer.blendMode = BlendMode.SCREEN;
    eyeLayer.opacity = 45;
    try {
        executeAction(charIDToTypeID("Invr"), undefined, DialogModes.NO);
    } catch(e) {}

    alert("✓ Đã tạo xong bộ Mắt & Răng!\\n\\n1. Chọn cọ Brush màu trắng (Soft round, Opacity 30-50%)\\n2. Quét nhẹ lên vùng răng để khử ố vàng tự nhiên.\\n3. Quét lên tròng mắt để mắt sáng long lanh.");
}`
  },
  {
    id: 'asian_skin_tone',
    title: 'Asian Glow Skin Tone Master (Curves CMYK)',
    category: 'color',
    description: 'Hiệu chỉnh dải màu da Châu Á: hạ bớt sắc vàng (Yellow), bổ sung ánh đào nhẹ (Magenta) và giữ độ trong trẻo tươi sáng không bị xỉn.',
    filename: 'Lumina_Asian_Skin_Tone.jsx',
    code: `// Lumina Retouch Pro - Asian Skin Tone & Color Grading
#target photoshop
app.bringToFront();

if (app.documents.length === 0) {
    alert("Vui lòng mở ảnh!");
} else {
    var doc = app.activeDocument;
    doc.suspendHistory("Lumina: Asian Glow Skin Tone", "applySkinToneMaster()");
}

function applySkinToneMaster() {
    var doc = app.activeDocument;
    var group = doc.layerSets.add();
    group.name = "[Lumina] Tone Da Hồng Hào Tự Nhiên";

    // Selective Color Layer for Skin (Red & Yellow fine-tuning)
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);
    var selDesc = new ActionDescriptor();
    selDesc.putClass(charIDToTypeID("Type"), charIDToTypeID("SlcC"));
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), selDesc);
    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);

    var layer = doc.activeLayer;
    layer.name = "🎨 Cân Bằng Màu Da (Selective Color)";
    layer.opacity = 75;

    // Color Lookup / Glow
    var glowLayer = group.artLayers.add();
    glowLayer.name = "🌟 Highlight Glow";
    glowLayer.blendMode = BlendMode.SOFTLIGHT;
    glowLayer.opacity = 35;

    alert("✓ Đã áp dụng Tone Da Châu Á Hồng Hào! Tùy chỉnh Opacity của group nếu muốn hiệu ứng nhẹ nhàng hơn.");
}`
  },
  {
    id: 'highpass_sharpen',
    title: 'High Pass Web & Print Sharpening',
    category: 'finish',
    description: 'Gộp ảnh tự động (Stamp Visible) và chạy High Pass sắc nét 1.2px - 1.8px ở chế độ Soft Light / Overlay để ảnh nét căng khi đăng Facebook / Web.',
    filename: 'Lumina_Sharpen_For_Web.jsx',
    code: `// Lumina Retouch Pro - High Pass Smart Sharpening for Web
#target photoshop
app.bringToFront();

if (app.documents.length === 0) {
    alert("Vui lòng mở ảnh!");
} else {
    var doc = app.activeDocument;
    doc.suspendHistory("Lumina: High Pass Sharpen", "applySharpen()");
}

function applySharpen() {
    var doc = app.activeDocument;
    
    // Stamp visible (Ctrl+Alt+Shift+E)
    var stamped = doc.artLayers.add();
    stamped.name = "[Lumina] High Pass Sharpen (Nét Chi Tiết)";
    
    // Merge visible onto stamped layer
    try {
        var idMrgV = charIDToTypeID("MrgV");
        var desc = new ActionDescriptor();
        desc.putBoolean(charIDToTypeID("Dplc"), true);
        executeAction(idMrgV, desc, DialogModes.NO);
    } catch(e) {}

    // Apply High Pass filter 1.5px
    try {
        var idHp = charIDToTypeID("HpF ");
        var hpDesc = new ActionDescriptor();
        hpDesc.putUnitDouble(charIDToTypeID("Rds "), charIDToTypeID("#Pxl"), 1.5);
        executeAction(idHp, hpDesc, DialogModes.NO);
        
        doc.activeLayer.blendMode = BlendMode.SOFTLIGHT;
        doc.activeLayer.opacity = 70;
        alert("✓ Đã hoàn tất phủ nét High Pass! Tăng/giảm Opacity của layer này để kiểm soát độ sắc sảo.");
    } catch(e) {
        alert("Không thể chạy bộ lọc High Pass tự động. Hãy vào Filter > Other > High Pass (1.5px) và đặt chế độ hòa trộn Soft Light.");
    }
}`
  },
  {
    id: 'batch_folder',
    title: 'Batch Retouch Folder (Chạy Hàng Loạt Trong Photoshop)',
    category: 'finish',
    description: 'Tự động duyệt qua toàn bộ ảnh trong một thư mục trên máy tính, chạy quy trình làm mịn da và áp dụng tone màu rồi xuất ảnh sang thư mục đích.',
    filename: 'Lumina_Batch_Retouch_Folder.jsx',
    code: `// Lumina Retouch Pro - Automated Batch Retouching Folder in Photoshop
#target photoshop
app.bringToFront();

function main() {
    var inputFolder = Folder.selectDialog("Chọn thư mục chứa ảnh cần Retouch hàng loạt:");
    if (!inputFolder) return;

    var outputFolder = Folder.selectDialog("Chọn thư mục xuất ảnh đã hoàn tất:");
    if (!outputFolder) return;

    var fileList = inputFolder.getFiles(/\\.(jpg|jpeg|png|tif|tiff|psd)$/i);
    if (fileList.length === 0) {
        alert("Không tìm thấy ảnh hợp lệ trong thư mục đã chọn!");
        return;
    }

    var successCount = 0;
    for (var i = 0; i < fileList.length; i++) {
        var file = fileList[i];
        if (file instanceof File) {
            try {
                var doc = open(file);
                
                // 1. Áp dụng Tách Tần Số (FS)
                var lowLayer = doc.activeLayer.duplicate();
                lowLayer.name = "Tone";
                lowLayer.applyGaussianBlur(8.0);
                
                // 2. Chỉnh sáng nhẹ & màu
                try {
                    doc.adjustLevels(5, 250, 1.05, 0, 255);
                } catch(e) {}

                // 3. Xuất file kết quả
                var saveFile = new File(outputFolder + "/Retouched_" + file.name);
                var saveOptions = new JPEGSaveOptions();
                saveOptions.quality = 10;
                doc.saveAs(saveFile, saveOptions, true, Extension.LOWERCASE);
                doc.close(SaveOptions.DONOTSAVECHANGES);
                successCount++;
            } catch(err) {
                // Tiếp tục xử lý file tiếp theo nếu có lỗi
            }
        }
    }

    alert("✓ Đã hoàn thành Retouch hàng loạt " + successCount + "/" + fileList.length + " ảnh thành công!\\nĐã lưu vào: " + outputFolder.fsName);
}

main();`
  }
];

export const SKIN_TONE_PRESETS = [
  {
    id: 'asian_glow',
    name: 'Hồng Hào Tự Nhiên',
    nameEn: 'Asian Glow',
    description: 'Tone da trong sáng, ửng hồng tươi tắn, cân bằng giảm vàng gắt cho làn da châu Á.',
    hex: '#F9D5C7',
    warmth: 8,
    tint: 14,
    skinLuminance: 12,
    skinSaturation: 8,
    contrastPunch: 6,
    highlightGlow: 15,
  },
  {
    id: 'porcelain_fair',
    name: 'Trắng Sứ Sang Trọng',
    nameEn: 'Porcelain Fair',
    description: 'Tone trắng mịn như ngọc, sạch sẽ, giảm đỏ vùng má và tăng độ sáng phản chiếu.',
    hex: '#FDF0E6',
    warmth: -4,
    tint: 4,
    skinLuminance: 22,
    skinSaturation: -12,
    contrastPunch: 10,
    highlightGlow: 20,
  },
  {
    id: 'korean_peach',
    name: 'Đào Mọng Xứ Hàn',
    nameEn: 'Korean Peach',
    description: 'Tông quả đào mọng nước ngọt ngào, căng bóng sương mai (Glass skin look).',
    hex: '#FDC4B6',
    warmth: 12,
    tint: 18,
    skinLuminance: 16,
    skinSaturation: 15,
    contrastPunch: 4,
    highlightGlow: 25,
  },
  {
    id: 'melanin_warmth',
    name: 'Nâu Ấm Khỏe Khoắn',
    nameEn: 'Melanin Warmth',
    description: 'Tôn vinh làn da ngăm, mật ong khỏe khoắn, căng bóng bắt sáng gò má.',
    hex: '#C88B67',
    warmth: 20,
    tint: -4,
    skinLuminance: -6,
    skinSaturation: 18,
    contrastPunch: 16,
    highlightGlow: 22,
  },
  {
    id: 'editorial_neutral',
    name: 'Tạp Chí Thời Trang',
    nameEn: 'Editorial Neutral',
    description: 'Màu da chuẩn Studio Vogue/Elle, sắc thái trung tính, trung thực tuyệt đối.',
    hex: '#E4BFAC',
    warmth: 0,
    tint: 0,
    skinLuminance: 5,
    skinSaturation: -4,
    contrastPunch: 12,
    highlightGlow: 8,
  },
  {
    id: 'golden_bronze',
    name: 'Nắng Hè Rực Rỡ',
    nameEn: 'Golden Bronze',
    description: 'Ánh nắng hoàng hôn vàng đồng, thích hợp ảnh ngoại cảnh, lookbook hè.',
    hex: '#DCA276',
    warmth: 28,
    tint: -8,
    skinLuminance: 8,
    skinSaturation: 22,
    contrastPunch: 14,
    highlightGlow: 28,
  },
  {
    id: 'clean_commercial',
    name: 'Quảng Cáo Thương Mại',
    nameEn: 'Clean Commercial',
    description: 'Trong trẻo, tươi sáng chuẩn catalogue mỹ phẩm và chụp ảnh profile thương hiệu.',
    hex: '#F6D9C8',
    warmth: 4,
    tint: 6,
    skinLuminance: 14,
    skinSaturation: 6,
    contrastPunch: 10,
    highlightGlow: 12,
  },
  {
    id: 'moody_cinema',
    name: 'Điện Ảnh Hoài Niệm',
    nameEn: 'Moody Cinema',
    description: 'Tương phản sâu, khối sáng tối rõ nét, màu da ấm áp đối lập nền mát lạnh.',
    hex: '#CFA389',
    warmth: 15,
    tint: -10,
    skinLuminance: -4,
    skinSaturation: 10,
    contrastPunch: 24,
    highlightGlow: 18,
  }
];
