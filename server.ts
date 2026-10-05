import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// High payload limit for portrait image base64 data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
  }
  return new GoogleGenAI({ apiKey });
};

// 1. Sửa chữa ảnh chân dung bằng AI theo câu lệnh văn bản (Text Prompt + Image)
app.post('/api/ai/edit-image', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Vui lòng cung cấp câu lệnh prompt mô tả chỉnh sửa.' });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu ảnh base64 cần chỉnh sửa.' });
    }

    const ai = getAiClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // gemini-3.1-flash-image-preview as requested, with fallback to gemini-3.1-flash-image / gemini-3.1-flash-lite-image
    const modelsToTry = [
      'gemini-3.1-flash-image-preview',
      'gemini-3.1-flash-image',
      'gemini-3.1-flash-lite-image',
    ];

    let lastError: any = null;
    let resultImageUrl: string | null = null;
    let textResponse = '';
    let successModel = '';

    for (const modelName of modelsToTry) {
      try {
        console.log(`[AI Edit] Trying model: ${modelName} with prompt: "${prompt.slice(0, 50)}..."`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: mimeType || 'image/jpeg',
                },
              },
              {
                text: `Professional portrait retouch and photo editing instruction: ${prompt}. Maintain realistic facial likeness, high quality skin texture, and photorealistic lighting.`,
              },
            ],
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              resultImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            } else if (part.text) {
              textResponse += part.text;
            }
          }
        }

        if (resultImageUrl) {
          successModel = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Edit] Model ${modelName} error:`, err?.message || err);
      }
    }

    if (!resultImageUrl) {
      throw lastError || new Error('Không nhận được hình ảnh sau chỉnh sửa từ Gemini AI.');
    }

    return res.json({
      success: true,
      imageUrl: resultImageUrl,
      text: textResponse,
      modelUsed: successModel,
    });
  } catch (error: any) {
    console.error('[AI Edit Error]', error);
    res.status(500).json({
      error: error?.message || 'Lỗi xử lý chỉnh sửa hình ảnh bằng AI.',
    });
  }
});

// 2. Tạo ảnh chân dung mới từ câu lệnh mô tả (Text Prompt to Image)
app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Vui lòng cung cấp câu lệnh prompt mô tả hình ảnh.' });
    }

    const ai = getAiClient();
    const modelsToTry = [
      'gemini-3.1-flash-image-preview',
      'gemini-3.1-flash-image',
      'gemini-3.1-flash-lite-image',
    ];

    let lastError: any = null;
    let resultImageUrl: string | null = null;
    let textResponse = '';
    let successModel = '';

    for (const modelName of modelsToTry) {
      try {
        console.log(`[AI Generate] Trying model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                text: `${prompt}, ultra high quality studio photography, 8k resolution, authentic skin pores, professional lighting`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio || '3:4',
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              resultImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            } else if (part.text) {
              textResponse += part.text;
            }
          }
        }

        if (resultImageUrl) {
          successModel = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Generate] Model ${modelName} error:`, err?.message || err);
      }
    }

    if (!resultImageUrl) {
      throw lastError || new Error('Không nhận được hình ảnh tạo từ Gemini AI.');
    }

    return res.json({
      success: true,
      imageUrl: resultImageUrl,
      text: textResponse,
      modelUsed: successModel,
    });
  } catch (error: any) {
    console.error('[AI Generate Error]', error);
    res.status(500).json({
      error: error?.message || 'Lỗi tạo hình ảnh bằng AI.',
    });
  }
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Lumina Retouch Pro server running at http://0.0.0.0:${port}`);
  });
}

startServer();
