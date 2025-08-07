// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Card, GameState } from './types';
import { DeckImageCutter } from './components/DeckImageCutter';
import { FieldLayout } from './components/FieldLayout';
import { HamburgerMenu } from './components/HamburgerMenu'; 
import { GuideModal } from './components/GuideModal'; 
import { HistoryModal } from './components/HistoryModal';
import './App.css';

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

export default function App() {
  // const [gameStarted, setGameStarted] = useState(false);
 const [gameStarted, setGameStarted] = useState(() => {
    // ページ読み込み時にlocalStorageにデータがあればtrue、なければfalseを返す
    return localStorage.getItem('rushDuelGameState') !== null;
  });

  const [initialState, setInitialState] = useState<GameState | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false); 
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [deckCutterKey, setDeckCutterKey] = useState<number | null>(null);


  useEffect(() => {
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  const handleCutComplete = (main: Card[], extra: Card[]) => {
    const shuffledMain = [...main].sort(() => Math.random() - 0.5);
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
    setInitialState(initialGameState);
    setGameStarted(true);
  };

  const handleResetApp = () => {
      localStorage.removeItem('rushDuelGameState'); 
      setGameStarted(false);
      setInitialState(null);
      setDeckCutterKey(Date.now());
  }


  // ★★★ メニュー項目を定義 ★★★
  const menuItems = [
    { label: '使い方ガイド', onClick: () => setIsGuideOpen(true) },
    { label: '別のデッキを読み込む', onClick: handleResetApp },
    { label: '更新履歴・Q&A', onClick: () => setIsHistoryOpen(true) },
    { label: 'Xでシェア', onClick: () => {
      // const text = encodeURIComponent('遊戯王ラッシュデュエル 一人回しツール');
      // const url = encodeURIComponent(window.location.href);
      // window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
    }},
  ];

  return (
    <>
    <div className="container">
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <main className="main-content">
        <div className="header">
            <HamburgerMenu items={menuItems} />
            <h1 className="title">遊戯王ラッシュデュエル 一人回しツール</h1>
            {!gameStarted ? (
                <DeckImageCutter  key={deckCutterKey}  onCutComplete={handleCutComplete} />
            ) : (
              <>
               {/* <button onClick={handleResetApp} className="menu-button" 
                style={{width: '200px', margin: '1rem auto', 
                backgroundColor: '#ef4444', 
                color: 'white',
                border: 'none'}}>別のデッキを読み込む</button> */}
              </>
            )}
        </div>
        <FieldLayout initialGameState={initialState || emptyGameState} />
      </main>
    </div>
    <footer>
      <p>
        since 2025.08.06<br/>
        ※非公式ファンサイト（管理人：エシマ <a href='https://youmagure.wew.jp/profile.html' target='blank'>Profile Page</a>）
      </p>
    </footer>
    </>
  );
}
