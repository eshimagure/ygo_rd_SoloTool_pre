// src/components/DeckImageCutter.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '../types';

interface DeckImageCutterProps {
  onCutComplete: (main: Card[], extra: Card[]) => void;
}

export const DeckImageCutter: React.FC<DeckImageCutterProps> = ({ onCutComplete }) => {
  const [status, setStatus] = useState('OCRライブラリを読み込み中...');
  const [isTesseractReady, setIsTesseractReady] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => {
      setIsTesseractReady(true);
      setStatus('デッキ画像を選択してください。');
    };
    script.onerror = () => {
      setStatus('エラー: OCRライブラリの読み込みに失敗しました。');
    };
    document.head.appendChild(script);

    return () => {
      const scriptElement = document.querySelector(`script[src="${script.src}"]`);
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

  const performOCR = async (canvas: HTMLCanvasElement, x: number, y: number, width: number, height: number): Promise<string> => {
    const ocrCanvas = document.createElement('canvas');
    ocrCanvas.width = width;
    ocrCanvas.height = height;
    const ocrCtx = ocrCanvas.getContext('2d');
    if (!ocrCtx) return '';
    ocrCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    const result = await (window as any).Tesseract.recognize(ocrCanvas, 'jpn');
    return result.data.text;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTesseractReady) {
        setStatus('OCRの準備ができていません。しばらくお待ちください。');
        return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('画像読み込み中...');
    const image = new Image();
    image.src = URL.createObjectURL(file);

    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const originalWidth = image.width;
      const targetWidth = 1080;
      const scale = targetWidth / originalWidth;
      canvas.width = targetWidth;
      canvas.height = image.height * scale;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      setStatus('デッキ枚数を解析中...');
      const mainText = await performOCR(canvas, 45, 72, 260, 48);
      const mainMatch = mainText.replace(/[ 　]/g, '').match(/メインデッキ[^\d]*(\d+)/);
      const mainCount = mainMatch ? parseInt(mainMatch[1], 10) : 0;
      
      if (mainCount === 0) {
        setStatus('メインデッキの枚数を認識できませんでした。');
        return;
      }

      setStatus(`メインデッキ${mainCount}枚を切り出し中...`);
      const cardWidth = canvas.width / 10;
      const cardHeight = cardWidth * 1.43;
      const mainImages: Card[] = [];
      for (let i = 0; i < mainCount; i++) {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const x = col * cardWidth;
        const y = 118 + row * cardHeight;
        const cardCanvas = document.createElement('canvas');
        cardCanvas.width = cardWidth;
        cardCanvas.height = cardHeight;
        const cardCtx = cardCanvas.getContext('2d');
        if (!cardCtx) continue;
        cardCtx.drawImage(canvas, x, y, cardWidth, cardHeight, 0, 0, cardWidth, cardHeight);
        mainImages.push({ id: `main-${Date.now()}-${i}`, src: cardCanvas.toDataURL() });
      }

      setStatus('エクストラデッキを解析中...');
      let extraTextY;
      if (mainCount <= 40) extraTextY = 735;
      else if (mainCount <= 50) extraTextY = 890;
      else extraTextY = 1042;

      const extraText = await performOCR(canvas, 45, extraTextY, 315, 48);
      const cleanedExtraText = extraText.replace(/[ 　]/g, '');
      // ★★★★★ 修正点 ★★★★★
      // 正規表現の `\\d` を `\d` に修正
      const extraMatch = cleanedExtraText.match(/エクストラデッキ[^\d]*(\d+)/);
      const extraCount = extraMatch ? parseInt(extraMatch[1], 10) : 0;

      const extraImages: Card[] = [];
      if (extraCount > 0) {
        setStatus(`エクストラデッキ${extraCount}枚を切り出し中...`);
        const extraYOffset = extraTextY + 48;
         for (let i = 0; i < extraCount; i++) {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const x = col * cardWidth;
            const y = extraYOffset + row * cardHeight;
            const cardCanvas = document.createElement('canvas');
            cardCanvas.width = cardWidth;
            cardCanvas.height = cardHeight;
            const cardCtx = cardCanvas.getContext('2d');
            if (!cardCtx) continue;
            cardCtx.drawImage(canvas, x, y, cardWidth, cardHeight, 0, 0, cardWidth, cardHeight);
            extraImages.push({ id: `extra-${Date.now()}-${i}`, src: cardCanvas.toDataURL() });
        }
      }

      setStatus(`検出完了：メイン ${mainCount}枚 / エクストラ ${extraCount}枚`);
      onCutComplete(mainImages, extraImages);
    };
  };

  return (
    <div className="header" 
    style={{ paddingTop: '2em',paddingBottom: '2em', backgroundColor: '#ffffff', borderRadius: '12px', 
    border: '1px solid #e5e7eb' }}>
      <h2 className="title" 
      style={{ fontSize: '2.5em', 
      color: '#1f2937' }}>デッキ画像を選択</h2>
      <p style={{fontSize: '1.6em', color: '#6b7280', margin: '1rem 0'}}>公式データベース「カードデータベース」から出力したデッキ画像を選択してください。</p>
      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={!isTesseractReady} style={{
          color: '#374151',
          backgroundColor: '#f9fafb',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          cursor: 'pointer'
      }}/>
      <div className="status">{status}</div>
    </div>
  );
};
