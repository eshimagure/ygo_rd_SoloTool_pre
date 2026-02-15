// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Card, GameState } from './types';
import { DeckImageCutter } from './components/DeckImageCutter';
import { FieldLayout } from './components/FieldLayout';
import { HamburgerMenu } from './components/HamburgerMenu'; 
import { GuideModal } from './components/GuideModal'; 
import { InfoModal } from './components/InfoModal';
import './App.css';
// "homepage": "https://eshimagure.github.io/ygo_rd_SoloTool_pre/",
// "homepage": "https://ygo-rd-fansite.ltt.jp/SoloTool/pre/",

// ゲーム状態の空の初期値
const emptyGameState: GameState = {
    deck: [],
    hand: [],
    grave: [],
    extra: [],
    free: [],
    zones: {
        monster1: null, monster2: null, monster3: null,
        spell1: null, spell2: null, spell3: null,
        field: null,
    },
    cardStates: {},
};

/**
 * アプリケーションの最上位コンポーネント
 * - ゲーム開始状態(gameStarted)の管理
 * - モーダル（ガイド、情報）の表示状態管理
 * - デッキ読み込み(DeckImageCutter)とゲーム盤面(FieldLayout)の表示切り替え
 */

export default function App() {
 // 1. ゲーム開始状態の管理
 const [gameStarted, setGameStarted] = useState(() => {
    // ページ読み込み時にlocalStorageにデータがあればtrue、なければfalseを返す
    return localStorage.getItem('rushDuelGameState') !== null;
  });
  // 2. ゲーム盤面の初期状態（デッキ読み込み後にセットされる）
  const [initialState, setInitialState] = useState<GameState | null>(null);
  // 3. 各種モーダルの開閉状態
  const [isGuideOpen, setIsGuideOpen] = useState(false); 
  const [isInfoOpen, setIsInfoOpen] = useState(false); 
  // 4. DeckImageCutterを強制的に再マウントさせるためのキー
  const [deckCutterKey, setDeckCutterKey] = useState<number | null>(null);

  // スマホでのオーバースクロール（画面バウンス）を無効化
  // カード移動中に画面がスクロールすると操作がしづらいため
  useEffect(() => {
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overscrollBehavior = ''; // クリーンアップ
    };
  }, []);

/**
 * DeckImageCutterでのデッキ切り出し完了時に呼ばれるハンドラ
 * @ param main メインデッキのカード配列
 * @ param extra エクストラデッキのカード配列
 */
  const handleCutComplete = (main: Card[], extra: Card[]) => {
    // メインデッキをシャッフル
    const shuffledMain = [...main].sort(() => Math.random() - 0.5); 
    // 最初の4枚を手札、残りをデッキに設定
    const initialHand = shuffledMain.slice(0, 4);
    const initialDeck = shuffledMain.slice(4);
    
    const initialGameState: GameState = {
        deck: initialDeck,
        hand: initialHand,
        grave: [],
        extra: extra,
        free: [],
        zones: {
            monster1: null, monster2: null, monster3: null,
            spell1: null, spell2: null, spell3: null,
            field: null,
        },
        cardStates: {},
    };
    setInitialState(initialGameState); // 初期状態をセット
    setGameStarted(true); // ゲーム開始フラグを立てる
  };

/**
 * 「別のデッキを読み込む」時に呼ばれるハンドラ
 * アプリの状態を完全にリセットする
 */
  const handleResetApp = () => {
      localStorage.removeItem('rushDuelGameState'); 
      setGameStarted(false);
      setInitialState(null);
      setDeckCutterKey(Date.now());
  }

// ハンバーガーメニューに渡す項目
  const menuItems = [
    { label: '使い方ガイド', onClick: () => setIsGuideOpen(true) },
    { label: '別のデッキを読み込む', onClick: handleResetApp },
    { label: '利用規約・Q&A・更新履歴', onClick: () => setIsInfoOpen(true) },
    { label: 'Xでシェア', onClick: () => {
      const text = encodeURIComponent('遊戯王ラッシュデュエル 一人回しツール Pre版');
      const url = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
    }},
  ];

  return (
    <>
    <div className="container">
      {/* モーダル類 */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      <main className="main-content">
        <div className="header">
          <HamburgerMenu items={menuItems} />
          <h1 className="title">遊戯王ラッシュデュエル 一人回しツール</h1>
            {/* ゲーム開始状態に応じて表示コンポーネントを切り替え */}
            {!gameStarted ? (
              // ゲーム未開始時：デッキ読み込み画面
              <DeckImageCutter  key={deckCutterKey}  onCutComplete={handleCutComplete} />
            ) : ( null )}
        </div>

        {/* ゲーム盤面は常に描画しておく。
        gameStartedがfalseの時はinitialStateがnull -> emptyGameStateが渡される。
        localStorageから復元する場合、gameStartedはtrueだがinitialStateはnull -> emptyGameStateが渡される。
        FieldLayout内部のロジックでlocalStorageのデータが読み込まれる。
        */}
        <FieldLayout initialGameState={initialState || emptyGameState} />
      </main>
    </div>
    <footer>
      <p>
        since 2025.08.17<br/>
        ※非公式ファンサイト（管理人：エシマ <a href='https://youmagure.wew.jp/profile.html' target='blank'>Profile Page</a>）
      </p>
    </footer>
    </>
  );
}
