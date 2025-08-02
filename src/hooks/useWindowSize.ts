import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export const useWindowSize = (): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // ウィンドウサイズが変更されたときに呼ばれる関数
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', handleResize);

    // コンポーネントがアンマウントされたときにリスナーをクリーンアップ
    return () => window.removeEventListener('resize', handleResize);
  }, []); // 空の配列を渡すことで、初回レンダリング時にのみ実行

  return windowSize;
};