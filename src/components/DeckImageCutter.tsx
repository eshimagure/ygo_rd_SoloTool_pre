// src/components/DeckImageCutter.tsx
import React, { useState, useEffect, ReactNode  } from 'react';
import { Card } from '../types';

interface DeckImageCutterProps {
  onCutComplete: (main: Card[], extra: Card[]) => void;
}

export const DeckImageCutter: React.FC<DeckImageCutterProps> = ({ onCutComplete }) => {
  const [status, setStatus] = useState<ReactNode>('OCRライブラリを読み込み中...');
  const [isTesseractReady, setIsTesseractReady] = useState(false);
  // 手動入力フォームの表示状態
  //  const [showManualInput, setShowManualInput] = useState(() => {
  //   // localStorageにフラグがあればtrue、なければfalseで初期化
  //   const shouldStartManual = localStorage.getItem('startWithManualInput') === 'true';
  //   if (shouldStartManual) {
  //     // フラグは一度使ったら削除する
  //     localStorage.removeItem('startWithManualInput');
  //     return true;
  //   }
  //   return false;
  // });
    // ★★★★★ stateを新しいフローに合わせて変更 ★★★★★
  const [isOcrComplete, setIsOcrComplete] = useState(false); // OCRが完了したかどうかのフラグ
  const [ocrMainCount, setOcrMainCount] = useState(0);         // OCRで読み取ったメインデッキ枚数
  const [ocrExtraCount, setOcrExtraCount] = useState(0);       // OCRで読み取ったエクストラデッキ枚数
  const [manualMainCount, setManualMainCount] = useState('');    // ユーザーが入力/修正するメインデッキ枚数
  const [manualExtraCount, setManualExtraCount] = useState('');   // ユーザーが入力/修正するエクストラデッキ枚数
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);

  // const [manualMainCount, setManualMainCount] = useState('');     // 手動入力されたメインデッキ枚数
  // const [manualExtraCount, setManualExtraCount] = useState('');    // 手動入力されたエクストラデッキ枚数
  // const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null); // アップロードされた画像を保持
  // ★★★★★ ここまで追加 ★★★★★

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
    setUploadedImage(image); // ★★★ アップロード画像をstateに保存 ★★★

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

      // --- OCR処理 ---
      setStatus('デッキ枚数を解析中...');
      const mainText = await performOCR(canvas, 45, 72, 260, 48);
      // const mainMatch = mainText.replace(/[ 　]/g, '').match(/メインデッキ[^\d]*(\d+)/);
        // ★★★★★ メインデッキの正規表現を修正 ★★★★★
      // 日韓表記、または「:」＋数字のパターンにマッチさせる
      const mainMatch = mainText.replace(/[ 　]/g, '').match(/(?:メインデッキ)[^\d]*(\d+)|:\s*(\d{1,2})/);
      // mainMatch[1]が日韓表記、mainMatch[2]が「:」＋数字のキャプチャ結果
      const  mainCountResult = mainMatch ? parseInt(mainMatch[1] || mainMatch[2], 10) : 0;
      console.log(mainMatch);
      console.log(mainCountResult);

      // ★★★★★ ここまで修正 ★★★★★
      // const mainCount = mainMatch ? parseInt(mainMatch[1], 10) : 0;

    // const mainCount = parseInt(manualMainCount, 10) || 0;
    // const extraCount = parseInt(manualExtraCount, 10) || 0;
      let extraTextY;
      if (mainCountResult <= 40) extraTextY = 735;
      else if (mainCountResult <= 50) extraTextY = 890;
      else extraTextY = 1042;
      const extraText = await performOCR(canvas, 45, extraTextY, 315, 48);
      const cleanedExtraText = extraText.replace(/[ 　]/g, '');
      // ★★★★★ 修正点 ★★★★★
      // 正規表現の `\\d` を `\d` に修正
      // const extraMatch = cleanedExtraText.match(/エクストラデッキ[^\d]*(\d+)/);
      // ★★★★★ エクストラデッキの正規表現を修正 ★★★★★
      const extraMatch = cleanedExtraText.match(/(?:エクストラデッキ)[^\d]*(\d+)|:\s*(\d{1,2})/);
      const extraCountResult = extraMatch ? parseInt(extraMatch[1] || extraMatch[2], 10) : 0;

          // --- stateの更新 ---
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

      
      // if (mainCount === 0) {
      //   // ★★★ OCR失敗時の処理を変更 ★★★
      //   setStatus('デッキ枚数の自動認識に失敗しました。手動で枚数を入力してください。');
      //   setShowManualInput(true); // 手動入力フォームを表示
      //   return; // ここで処理を中断
      // }

      // setStatus(`メインデッキ${mainCount}枚を切り出し中...`);
      // const cardWidth = canvas.width / 10;
      // const cardHeight = cardWidth * 1.43;
      // const mainImages: Card[] = [];
      // for (let i = 0; i < mainCount; i++) {
      //   const row = Math.floor(i / 10);
      //   const col = i % 10;
      //   const x = col * cardWidth;
      //   const y = 118 + row * cardHeight;
      //   const cardCanvas = document.createElement('canvas');
      //   cardCanvas.width = cardWidth;
      //   cardCanvas.height = cardHeight;
      //   const cardCtx = cardCanvas.getContext('2d');
      //   if (!cardCtx) continue;
      //   cardCtx.drawImage(canvas, x, y, cardWidth, cardHeight, 0, 0, cardWidth, cardHeight);
      //   mainImages.push({ id: `main-${Date.now()}-${i}`, src: cardCanvas.toDataURL() });
      // }

      // setStatus('エクストラデッキを解析中...');
      // let extraTextY;
      // if (mainCount <= 40) extraTextY = 735;
      // else if (mainCount <= 50) extraTextY = 890;
      // else extraTextY = 1042;

      // const extraText = await performOCR(canvas, 45, extraTextY, 315, 48);
      // const cleanedExtraText = extraText.replace(/[ 　]/g, '');
      // ★★★★★ 修正点 ★★★★★
      // 正規表現の `\\d` を `\d` に修正
      // const extraMatch = cleanedExtraText.match(/エクストラデッキ[^\d]*(\d+)/);
      // ★★★★★ エクストラデッキの正規表現を修正 ★★★★★
      // const extraMatch = cleanedExtraText.match(/(?:エクストラデッキ)[^\d]*(\d+)|:\s*(\d{1,2})/);
      // const extraCount = extraMatch ? parseInt(extraMatch[1] || extraMatch[2], 10) : 0;
      // ★★★★★ ここまで修正 ★★★★★
      // const extraCount = extraMatch ? parseInt(extraMatch[1], 10) : 0;

      // const extraImages: Card[] = [];
      // if (extraCount > 0) {
      //   setStatus(`エクストラデッキ${extraCount}枚を切り出し中...`);
      //   const extraYOffset = extraTextY + 48;
      //    for (let i = 0; i < extraCount; i++) {
      //       const row = Math.floor(i / 10);
      //       const col = i % 10;
      //       const x = col * cardWidth;
      //       const y = extraYOffset + row * cardHeight;
      //       const cardCanvas = document.createElement('canvas');
      //       cardCanvas.width = cardWidth;
      //       cardCanvas.height = cardHeight;
      //       const cardCtx = cardCanvas.getContext('2d');
      //       if (!cardCtx) continue;
      //       cardCtx.drawImage(canvas, x, y, cardWidth, cardHeight, 0, 0, cardWidth, cardHeight);
      //       extraImages.push({ id: `extra-${Date.now()}-${i}`, src: cardCanvas.toDataURL() });
      //   }
      // }

      // setStatus(`検出完了：メイン ${mainCount}枚 / エクストラ ${extraCount}枚`);
      // onCutComplete(mainImages, extraImages);
    };
  };

    // ★★★★★ 手動切り出し用の関数を新しく作成 ★★★★★
  const handleExecuteCut = async () => {
    if (!uploadedImage) return;

    const mainCount = parseInt(manualMainCount, 10) || 0;
    const extraCount = parseInt(manualExtraCount, 10) || 0;

    if (mainCount === 0) {
      setStatus('メインデッキの枚数を入力してください。');
      return;
    }
    
    // handleImageUploadからcanvas作成ロジックを再利用
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const originalWidth = uploadedImage.width;
    const targetWidth = 1080; // 解像度を維持
    const scale = targetWidth / originalWidth;
    canvas.width = targetWidth;
    canvas.height = uploadedImage.height * scale;
    ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);

    // メインデッキの切り出し
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

    // エクストラデッキの切り出し
    const extraImages: Card[] = [];
    if (extraCount > 0) {
      setStatus(`エクストラデッキ${extraCount}枚を切り出し中...`);
      let extraTextY; // OCR時とY座標の基準が異なるため再計算
      if (mainCount <= 40) extraTextY = 735;
      else if (mainCount <= 50) extraTextY = 890;
      else extraTextY = 1042;
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

  return (
    <div className="header" 
    style={{ paddingTop: '2em',paddingBottom: '2em', borderRadius: '12px', 
    border: '1px solid #cececeff' }}>
      <h2 className="title" 
      style={{ fontSize: '2.5em',}}>デッキ画像を選択</h2>
      <p style={{fontSize: '1.6em', margin: '1rem 0'}}>公式アプリ「ニューロン」から出力したデッキ画像を選択してください。</p>

      {/* <input type="file" accept="image/*" onChange={handleImageUpload} disabled={!isTesseractReady} style={{
          color: '#374151',
          backgroundColor: '#f9fafb',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          cursor: 'pointer'
      }}/>
      <div className="status">{status}</div>
    </div> */}
       {/* ★★★ showManualInputがfalseの場合のみファイル選択を表示 ★★★ */}
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

          {/* ★★★ 手動モード開始時に画像未選択の場合のメッセージを追加 ★★★ */}
        {/* ★★★★★ OCR完了後は、結果確認・修正フォームを表示 ★★★★★ */}
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
          <button onClick={handleExecuteCut} className="operation-button red" style={{ padding: '1rem 2rem' }}>
            この枚数で切り出しを実行
          </button>
        </div>
      )}

    </div>
  );
};
