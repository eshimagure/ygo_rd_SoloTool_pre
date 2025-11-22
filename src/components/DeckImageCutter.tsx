// src/components/DeckImageCutter.tsx
import React, { useState, useEffect, ReactNode  } from 'react';
import { Card } from '../types';

interface DeckImageCutterProps {
  onCutComplete: (main: Card[], extra: Card[]) => void;
}

/**
 * デッキ画像からカードを切り出すコンポーネント
 * - Tesseract.js（OCRライブラリ）の読み込み
 * - デッキ画像からOCRでデッキ枚数を自動解析
 * - ユーザーによる枚数修正
 * - 確定した枚数に基づいてカード画像を切り出し、Appコンポーネントに渡す
 */
export const DeckImageCutter: React.FC<DeckImageCutterProps> = ({ onCutComplete }) => {
  // State定義
  const [status, setStatus] = useState<ReactNode>('OCRライブラリを読み込み中...'); // ユーザーへの案内メッセージ
  const [isTesseractReady, setIsTesseractReady] = useState(false);  // OCRライブラリの準備完了フラグ
  const [isOcrComplete, setIsOcrComplete] = useState(false);  // OCR完了フラグ（枚数修正画面へ移行）
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null); // 読み込んだ画像データ
  // OCR関連のステート
  const [ocrMainCount, setOcrMainCount] = useState(0);         // OCRで読み取ったメインデッキ枚数
  const [ocrExtraCount, setOcrExtraCount] = useState(0);       // OCRで読み取ったエクストラデッキ枚数
  const [manualMainCount, setManualMainCount] = useState('');    // ユーザーが入力/修正するメインデッキ枚数
  const [manualExtraCount, setManualExtraCount] = useState('');   // ユーザーが入力/修正するエクストラデッキ枚数

  // Tesseract.js（OCRライブラリ）をCDNから動的に読み込む
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
    // コンポーネント破棄時にスクリプトタグを削除
    return () => {
      const scriptElement = document.querySelector(`script[src="${script.src}"]`);
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

/**
 * 指定されたキャンバスの特定領域に対してOCRを実行する
 */
  const performOCR = async (canvas: HTMLCanvasElement, x: number, y: number, width: number, height: number): Promise<string> => {
    const ocrCanvas = document.createElement('canvas');
    ocrCanvas.width = width;
    ocrCanvas.height = height;
    const ocrCtx = ocrCanvas.getContext('2d');
    if (!ocrCtx) return '';
    // 元のキャンバスから指定領域を切り出して描画
    ocrCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    const result = await (window as any).Tesseract.recognize(ocrCanvas, 'jpn');
    return result.data.text;
  };

/**
 * ユーザーによる画像アップロード時のハンドラ
 */
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
    setUploadedImage(image); // アップロード画像をstateに保存 

    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      //デバイスによってデッキレシピ画像の大きさが異なるため、同一に切り出しを行うため幅のpxサイズを指定してリサイズ
      const originalWidth = image.width;
      const targetWidth = 1080; 
      const scale = targetWidth / originalWidth;
      canvas.width = targetWidth;
      canvas.height = image.height * scale;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

////////// OCR処理 //////////
      setStatus('デッキ枚数を解析中...');
      // 1. メインデッキの枚数をOCR
      //デッキ画像に記載されている メインデッキ：n枚 のXY座標位置
      const mainText = await performOCR(canvas, 45, 72, 260, 48);
      // 日韓表記、または「:」＋数字のパターンにマッチさせる
      const mainMatch = mainText.replace(/[ 　]/g, '').match(/(?:メインデッキ)[^\d]*(\d+)|:\s*(\d{1,2})/);
      // mainMatch[1]が日韓表記、mainMatch[2]が「:」＋数字のキャプチャ結果
      const  mainCountResult = mainMatch ? parseInt(mainMatch[1] || mainMatch[2], 10) : 0;

      // 2. エクストラデッキの枚数をOCR（Y座標はメインデッキの枚数に応じて変動）
      //デッキ画像に記載されている エクストラデッキ：n枚 の座標位置
      //メインデッキの枚数によってXY座標位置を指定
      let extraTextY;
      if (mainCountResult <= 40) extraTextY = 735;
      else if (mainCountResult <= 50) extraTextY = 890;
      else extraTextY = 1042;
      const extraText = await performOCR(canvas, 45, extraTextY, 315, 48);
      const cleanedExtraText = extraText.replace(/[ 　]/g, '');
      const extraMatch = cleanedExtraText.match(/(?:エクストラデッキ)[^\d]*(\d+)|:\s*(\d{1,2})/);
      const extraCountResult = extraMatch ? parseInt(extraMatch[1] || extraMatch[2], 10) : 0;

      // 3. OCR結果をstateにセット
      setOcrMainCount(mainCountResult);
      setOcrExtraCount(extraCountResult);
      // ユーザーが修正できるように、手入力用のstateにもOCRの結果を事前入力しておく
      setManualMainCount(mainCountResult > 0 ? String(mainCountResult) : '');
      setManualExtraCount(extraCountResult > 0 ? String(extraCountResult) : '');

      setStatus(mainCountResult > 0 ? (
          <>
            デッキレシピ取得が完了しました。
            <br />
            枚数を確認・修正してください。
          </>
        ):  (
          <>
            デッキレシピ取得に失敗しました。
            <br />
            手動で枚数を入力してください。
          </>
        ));
      setIsOcrComplete(true); // OCR完了フラグを立て、確認・修正画面を表示
    };
  };

/**
 * 「この枚数で切り出しを実行」ボタン押下時のハンドラ
 */
  const handleExecuteCut = async () => {
    if (!uploadedImage) return;
    // ユーザーが入力した（または修正した）枚数を取得
    const mainCount = parseInt(manualMainCount, 10) || 0;
    const extraCount = parseInt(manualExtraCount, 10) || 0;

    if (mainCount === 0) {
      setStatus('メインデッキの枚数を入力してください。');
      return;
    }

    // OCR時と同様にキャンバスを準備
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const originalWidth = uploadedImage.width;
    const targetWidth = 1080; // 解像度を維持
    const scale = targetWidth / originalWidth;
    canvas.width = targetWidth;
    canvas.height = uploadedImage.height * scale;
    ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);

    // 1.メインデッキの切り出し
    setStatus(`メインデッキ${mainCount}枚を切り出し中...`);
    // デッキレシピの横幅の10等分 ＝ カード画像の横幅と定義 
    // カード画像の横幅の1.43倍を カード画像の縦幅と定義
    const cardWidth = canvas.width / 10;
    const cardHeight = cardWidth * 1.43;
    const mainImages: Card[] = [];
    for (let i = 0; i < mainCount; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const x = col * cardWidth;
      const y = 118 + row * cardHeight;  // Y座標は「メインデッキ：n枚」等のヘッダー（118px）分ずらす
      const cardCanvas = document.createElement('canvas');
      cardCanvas.width = cardWidth;
      cardCanvas.height = cardHeight;
      const cardCtx = cardCanvas.getContext('2d');
      if (!cardCtx) continue;
      cardCtx.drawImage(canvas, x, y, cardWidth, cardHeight, 0, 0, cardWidth, cardHeight);
      mainImages.push({ id: `main-${Date.now()}-${i}`, src: cardCanvas.toDataURL() });
    }

    // 2.エクストラデッキの切り出し
    const extraImages: Card[] = [];
    if (extraCount > 0) {
      setStatus(`エクストラデッキ${extraCount}枚を切り出し中...`);
      let extraTextY; // OCR時とY座標の基準が異なるため再計算
      if (mainCount <= 40) extraTextY = 735;
      else if (mainCount <= 50) extraTextY = 890;
      else extraTextY = 1042;
      const extraYOffset = extraTextY + 48; // EXデッキのテキストの真下から切り出し開始

       for (let i = 0; i < extraCount; i++) {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const x = col * cardWidth;
          const y = extraYOffset + row * cardHeight;
          // (メインデッキと同様の切り出し処理)
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
    // 完了後、Appコンポーネントにカード配列を渡す
    onCutComplete(mainImages, extraImages);
  };

  return (
    <div className="header" 
    style={{ paddingTop: '2em',paddingBottom: '2em', borderRadius: '12px', 
    border: '1px solid #cececeff' }}>
      <h2 className="title" 
      style={{ fontSize: '2.5em',}}>デッキ画像を選択</h2>
      <p style={{fontSize: '1.6em', margin: '1rem 0'}}>公式アプリ「ニューロン」から出力したデッキ画像を選択してください。</p>

      {/* showManualInputがfalseの場合のみファイル選択を表示 */}
      {/* OCR完了前は、ファイル選択フォームを表示 */}
      {!isOcrComplete  && (
        <>
        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={!isTesseractReady} style={{
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          cursor: 'pointer'}}/>
        <div style={{ fontSize: 'clamp(12px, 1.5rem, 16px)' }}>{status}</div>
        </>
      )}

      {/*  手動モード開始時に画像未選択の場合のメッセージを追加  */}
      {/*  OCR完了後は、結果確認・修正フォームを表示  */}
      {isOcrComplete && (
        <div className='deckImageCutter'>
            {uploadedImage && (
            <div style={{ marginBottom: '1rem', border: '1px solid #ddd' }}>
              <img 
                src={uploadedImage.src} 
                alt="アップロードされたデッキレシピ" 
                style={{ width: '100%', maxWidth: '400px', display: 'block', margin: 'auto' }} 
              />
            </div>
          )}
          <div style={{ fontSize: 'clamp(12px, 1.5rem, 16px)' }}>
            {status}<br/>
            <span style={{ display: 'none' }}>読み込み結果：<strong> メイン {ocrMainCount} 枚 / エクストラ {ocrExtraCount} 枚</strong></span>
          </div>

          {/* 枚数修正フォーム */}
          <div style={{ display: 'flex',fontWeight:'bold'}}>
            <div>
              <label htmlFor="main-deck-count" style={{ marginRight: '1rem' }}>メイン:</label>
              <input
                id="main-deck-count" type="number"
                value={manualMainCount}
                onChange={(e) => setManualMainCount(e.target.value)}
                style={{ width: '8rem', padding: '4px' }} />
                枚／
            </div>
            <div>
              <label htmlFor="extra-deck-count" style={{ marginRight: '0.5rem' }}>エクストラ:</label>
              <input
                id="extra-deck-count" type="number"
                value={manualExtraCount}
                onChange={(e) => setManualExtraCount(e.target.value)}
                style={{ width: '8rem', padding: '4px' }} />
              枚
            </div>
          </div>
          
          {/* 切り出し実行ボタン */}
          <button onClick={handleExecuteCut} className="operation-button red" style={{ padding: '1rem 2rem' }}>
            この枚数で切り出しを実行
          </button>
        </div>
      )}

    </div>
  );
};
