// src/components/FieldLayout.tsx
import React, { useState, useEffect, useMemo } from 'react'; 
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  closestCenter,
  pointerWithin,
  CollisionDetection,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardState, GameState, ArrayZoneName } from '../types';
import { FieldZones } from './FieldZones';
import { SortableCard } from './SortableCard';
import { useWindowSize } from '../hooks/useWindowSize';

interface FieldLayoutProps {
  initialGameState: GameState;
}

/**
 * ゲーム盤面全体のレイアウトとロジックを管理するメインコンポーネント
 * - ゲーム状態(gameState)の管理
 * - ドラッグ＆ドロップ(dnd-kit)の処理
 * - 各種ゲーム操作（ドロー、リセットなど）のハンドラ
 * - ポップアップやコンテキストメニューの表示制御
 */

export const FieldLayout: React.FC<FieldLayoutProps> = ({ initialGameState }) => {
  // State定義
  const { width } = useWindowSize(); // レスポンシブ対応のためのカスタムフック 画面幅の管理
  const [history, setHistory] = useState<GameState[]>([]); // 操作履歴（「戻る」機能用）
  const [activeCard, setActiveCard] = useState<Card | null>(null); // D&D中にドラッグしているカード
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null); // ホバー中のカードID
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, cardId: string, location: string } | null>(null); // コンテキストメニュー
  const [showGravePopup, setShowGravePopup] = useState(false); // 墓地ポップアップ
  const [resultPopupContent, setResultPopupContent] = useState<string | null>(null); // サイコロ・コイン結果
  const [isResetPopupOpen, setIsResetPopupOpen] = useState(false); // リセット確認ポップアップの表示状態を管理するstate

  // 1. 初期化ロジック: localStorageからデータを読み込む
  //  関数を渡すことで、高コストなlocalStorageの読み取りを初回マウント時のみ実行
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const savedState = localStorage.getItem('rushDuelGameState');
      if (savedState) {
        return JSON.parse(savedState);  // 保存されたデータがあれば、それを使って初期化
      }
    } catch (error) {
      console.error("Failed to parse saved state:", error);
    }
    return initialGameState; // 保存されたデータがなければ、propsの初期値を使う
  });

  // 2. 保存ロジック: gameStateが変更されるたびにlocalStorageに保存する
  //ページから離れていても盤面の状態を保持しておきたい
  useEffect(() => {
    // gameStateが空でない場合のみ保存（初期化直後などを除く）
    if (gameState && gameState.deck.length > 0) {
      localStorage.setItem('rushDuelGameState', JSON.stringify(gameState));
    }
  }, [gameState]);

  // 3. propsの初期値が変更された場合（新しいデッキを読み込んだ場合）の処理
  useEffect(() => {
    // initialGameStateが空でない（＝新しいデッキが読み込まれた）場合、gameStateを上書き
    if (initialGameState && initialGameState.deck.length > 0) {
      setGameState(initialGameState);
    }
  }, [initialGameState]);

  // D&Dセンサー（PointerSensor: マウス、タッチ、ペンを統合）
  const sensors = useSensors(
    useSensor(PointerSensor),
  );

  // D&Dの衝突検出戦略（ポインター位置を優先し、なければ最も近い中央を検出）
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCenter(args);
  };

  // 操作履歴を保存
  const saveHistory = () => setHistory(prev => [...prev, gameState]);
  // 操作を1つ戻す
  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setGameState(lastState);
    setHistory(prev => prev.slice(0, -1));
  };

  // リセット用ポップアップを開く
  const openResetPopup = () => {
    setIsResetPopupOpen(true);
  };

//////////////// デッキのリセット関数 ////////////////
  // 種類1: 完全に初期状態に戻すリセット
  const handleFullReset = () => {
      setGameState(initialGameState);
      setHistory([]);
      setIsResetPopupOpen(false); // ポップアップを閉じる
  };

  // 種類2: デッキをシャッフルして新しい手札で始めるリセット
  const handleShuffleReset = () => {
      // initialGameStateをベースに新しい状態を作成
      const originalDeck = [...initialGameState.deck, ...initialGameState.hand];
      const shuffledDeck = originalDeck.sort(() => Math.random() - 0.5);
      
      const newHand = shuffledDeck.slice(0, 4);
      const newDeck = shuffledDeck.slice(4);

      const newShuffledState: GameState = {
        ...initialGameState, // 墓地、EX、フリーゾーンなどは初期状態を引き継ぐ
        deck: newDeck,
        hand: newHand,
        cardStates: {}, // カードの状態はリセット
      };
      
      setGameState(newShuffledState);
      setHistory([]);
      setIsResetPopupOpen(false); // ポップアップを閉じる
    // }
  };
  
//////////////// D&D処理 ////////////////
  // カードIDから、そのカードが存在するゾーン名（コンテナID）を検索
  const findCardLocation = (cardId: string): string | null => {
      const arrayZones: ArrayZoneName[] = ['deck', 'hand', 'grave', 'extra', 'free'];
      for (const zone of arrayZones) {
          if (gameState[zone].some(c => c.id === cardId)) return zone;
      }
      for (const zone in gameState.zones) {
          if (gameState.zones[zone as keyof typeof gameState.zones]?.id === cardId) return zone;
      }
      return null;
  };

  // ドラッグ開始時の処理
  const handleDragStart = (event: DragStartEvent) => {
    const cardId = String(event.active.id);
    // 全ゾーンからドラッグしたカードの情報を検索
    const card = 
        [...gameState.deck, ...gameState.hand, ...gameState.grave, ...gameState.extra, ...gameState.free, ...Object.values(gameState.zones).filter(Boolean)]
        .find(c => c && c.id === cardId);
    setActiveCard(card || null); // activeCardにセット
  };

  // ドラッグ終了時の処理
  // ドラッグ処理した・しない。ドラッグ先の場所、ドラッグ先のカードの有無によって終了時の処理が変わるため複雑化している
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null); //ドラッグ中カードをリセット
    if (!over) return; //ドロップ先がなければ何もしない
    
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return; // 同じ場所なら何もしない
    saveHistory(); // 状態変更前に履歴を保存
    setGameState(prev => {
        // 1. ドラッグ元(from)とドロップ先(to)のコンテナIDを特定
        const fromContainer = findCardLocation(activeId);
        const toContainer = findCardLocation(overId) || overId;
        
        if (!fromContainer) return prev; // ドラッグ元不明なら何もしない

        // 2. シングルカードゾーン（モンスター/魔法/フィールド）へのドロップ処理
        const singleCardZoneIds = ['field', 'monster1', 'monster2', 'monster3', 'spell1', 'spell2', 'spell3'];
        if (singleCardZoneIds.includes(toContainer) && prev.zones[toContainer as keyof typeof prev.zones]) {
            return prev; // 既にカードがあればドロップ不可
        }
        
        // 3. コンテナが配列か（deck, handなど）、シングルゾーンか（monster1など）を判別
        const arrayContainers: ArrayZoneName[] = ['deck', 'hand', 'grave', 'extra', 'free'];
        const isFromContainerArray = arrayContainers.includes(fromContainer as ArrayZoneName);
        const isToContainerArray = arrayContainers.includes(toContainer as ArrayZoneName);

        // 4. 同一配列内での並び替え処理 (例: 手札内の並び替え)
        if (fromContainer === toContainer && isFromContainerArray) {
            const containerKey = fromContainer as ArrayZoneName;
            const oldIndex = prev[containerKey].findIndex(c => c.id === activeId);
            const newIndex = prev[containerKey].findIndex(c => c.id === overId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newState = JSON.parse(JSON.stringify(prev)); // 簡易ディープコピー
                newState[containerKey] = arrayMove(prev[containerKey], oldIndex, newIndex);
                return newState;
            }
        }

        // 5. 異なるコンテナ間でのカード移動処理
        const newState = JSON.parse(JSON.stringify(prev));
        const card = [...prev.deck, ...prev.hand, ...prev.grave, ...prev.extra, ...prev.free, ...Object.values(prev.zones).filter(Boolean)].find(c => c && c.id === activeId);
        if (!card) return prev;

        // 5a もしカードが移動された場合、そのカード状態（向きなど）をリセット
        if (singleCardZoneIds.includes(fromContainer)) {
            newState.cardStates[activeId] = { rotation: 0, hidden: false };
        }
        // 5b. ドラッグ元のコンテナからカードを削除
        if (isFromContainerArray) {
            const containerKey = fromContainer as ArrayZoneName;
            newState[containerKey] = newState[containerKey].filter((c: Card) => c.id !== activeId);
        } else {
            newState.zones[fromContainer as keyof typeof newState.zones] = null;
        }
        // 5c. ドロップ先のコンテナにカードを追加
        if (isToContainerArray) {
            const containerKey = toContainer as ArrayZoneName;
            const targetArray: Card[] = newState[containerKey];
            const overIsCard = findCardLocation(overId) === containerKey;
            // デッキへのドロップは特殊処理（デッキへ戻す順番など、ルールに従う必要があるため）
            if (containerKey === 'deck') {
                if (overIsCard) {
                    targetArray.unshift(card); // カードの上ならデッキトップへ
                } else {
                    targetArray.push(card); // ゾーンにならデッキボトムへ
                }
            } else {
                // 他の配列ゾーンでは、ドロップ先のカードの直後に追加
                const overIndex = targetArray.findIndex((c: Card) => c.id === overId);
                if (overIndex !== -1) {
                     targetArray.splice(overIndex + 1, 0, card);
                } else {
                     targetArray.push(card);
                }
            }
        } else {
            // シングルカードゾーンへのドロップ
            newState.zones[toContainer as keyof typeof newState.zones] = card;
            // 新しいゾーンに置かれたカードの状態も初期化
            newState.cardStates[card.id] = { rotation: 0, hidden: false };
        }
        return newState;
    });
  };

//////////////// デッキ操作ハンドラ ////////////////
  // 指定枚数ドロー
  const handleDraw = (count: number) => {
    if (gameState.deck.length < count) return;
    saveHistory();
    setGameState(prev => {
        const drawn = prev.deck.slice(0, count);
        return { ...prev, deck: prev.deck.slice(count), hand: [...prev.hand, ...drawn] };
    });
  };

  // 通常ドロー （手札が5枚未満なら5枚になるまで、5枚以上なら1枚）
  const handleSmartDraw = () => {
    const currentHandSize = gameState.hand.length;
    if (currentHandSize < 5) {
      // 手札が5枚になるまでドロー
      const cardsToDraw = 5 - currentHandSize;
      handleDraw(cardsToDraw);
    } else {
      // 手札が5枚以上なら1枚ドロー
      handleDraw(1);
    }
  };

  // デッキシャッフル ////////// 
  const handleShuffle = () => {
    //ボタン誤クリック防止のためconfirmで確認
     if (window.confirm("デッキをシャッフルしますか？")) {
      saveHistory();
      setGameState(prev => ({ ...prev, deck: [...prev.deck].sort(() => Math.random() - 0.5) }));
    }
  };

  // フリースペースのカードをデッキトップへ
  const handleReturnFreeToTop = () => {
    if (gameState.free.length === 0) return; // フリーゾーンが空なら何もしない
    saveHistory();
    setGameState(prev => ({
      ...prev,
      // デッキ配列の先頭にフリーゾーンのカードを追加
      deck: [...prev.free, ...prev.deck],
      // フリーゾーンを空にする
      free: [],
    }));
  };

  // フリースペースのカードをデッキボトムへ
  const handleReturnFreeToBottom = () => {
    if (gameState.free.length === 0) return; // フリーゾーンが空なら何もしない

    saveHistory();
    setGameState(prev => ({
      ...prev,
      // デッキ配列の末尾にフリーゾーンのカードを追加
      deck: [...prev.deck, ...prev.free],
      // フリーゾーンを空にする
      free: [],
    }));
  };

  // デッキトップを墓地へ
  const handleSendTopToGrave = () => {
    if (gameState.deck.length === 0) return;
    saveHistory();
    setGameState(prev => {
        const topCard = prev.deck[0];
        return { ...prev, deck: prev.deck.slice(1), grave: [topCard, ...prev.grave] };
    });
  };

////////// ユーティリティの機能 ////////// 
  //サイコロ
    const handleDiceRoll = () => {
    const result = Math.floor(Math.random() * 6) + 1;
    setResultPopupContent(`サイコロの目は「${result}」です`);
  };
  //コイン
  const handleCoinFlip = () => {
    const result = Math.random() < 0.5 ? '表' : '裏';
    setResultPopupContent(`コインの結果は「${result}」です`);
  };


////////// フィールド上のカード画像コンテキストメニュー表示関連 ////////// 
  // メニュー表示（PCの右クリック / スマホのダブルタップ）
  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, cardOrZoneId: Card | string) => {
    e.preventDefault();
    e.stopPropagation();
    
    let x = 0;
    let y = 0;

    // イベントの種類を判別して座標を取得
    if ('touches' in e) {
      // TouchEventの場合 (スマートフォン)
      x = e.changedTouches[0].clientX;
      y = e.changedTouches[0].clientY;
    } else {
      // MouseEventの場合 (PC)
      x = e.clientX;
      y = e.clientY;
    }

    const cardId = typeof cardOrZoneId === 'string' ? gameState.zones[cardOrZoneId as keyof typeof gameState.zones]?.id : cardOrZoneId?.id;
    if (!cardId) return;
    const location = findCardLocation(cardId);
    if (!location || ['deck', 'hand', 'grave', 'extra', 'free'].includes(location)) return;
    setContextMenu({ x, y, cardId, location });
  };

  // メニューを閉じる
  const closeContextMenu = () => setContextMenu(null);
  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  // 表示形式のトグル（攻撃/守備、表/裏）
  // モンスター / 魔法・罠カードかによって分岐が異なる
  const toggleDisplayMode = () => {
    if (!contextMenu) return;
    saveHistory();
    const { cardId, location } = contextMenu;
    setGameState(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const cardState = newState.cardStates[cardId] || { rotation: 0, hidden: false };
        
        //モンスターゾーン
        if (location.startsWith('monster')) {
            if (cardState.hidden) { 
                // 裏なら表攻撃
                cardState.rotation = 0;
                cardState.hidden = false;
            } else if (cardState.rotation === 0) { 
                // 表攻撃なら表守備
                cardState.rotation = -90;
            } else {
                // 表守備なら表攻撃
                cardState.rotation = 0;
            }
        } else if (location.startsWith('field') || location.startsWith('spell')) {
            cardState.hidden = !cardState.hidden;
        }

        newState.cardStates[cardId] = cardState;
        return newState;
    });
    closeContextMenu();
  };

  // 裏側守備表示にセット
  const setFaceDownDefense = () => {
    if (!contextMenu) return;
    saveHistory();
    const { cardId } = contextMenu;
    setGameState(prev => ({ ...prev, cardStates: { ...prev.cardStates, [cardId]: { rotation: -90, hidden: true } } }));
    closeContextMenu();
  };

  // カードIDから現在の状態（向き、裏表）を取得
  const getCardState = (cardId: string): CardState => gameState.cardStates[cardId] || { rotation: 0, hidden: false };

  // dnd-kitのSortableContextに渡す全アイテムIDのリスト
  // useMemoでgameStateの変更時のみ再計算
  const allItemIds = useMemo(() => {
    const zoneCards = Object.values(gameState.zones).filter(Boolean).map(c => c!.id);
    return [
        ...Object.keys(gameState.zones), 'deck', 'hand', 'grave', 'extra', 'free', //ゾーンへのID
        ...gameState.deck.map(c => c.id), ...gameState.hand.map(c => c.id), // 各ゾーンのカードID
        ...gameState.grave.map(c => c.id), ...gameState.extra.map(c => c.id),
        ...gameState.free.map(c => c.id),
        ...zoneCards
    ];
  }, [gameState]);

  // コンテキストメニュー用
  const currentCardState = contextMenu ? getCardState(contextMenu.cardId) : null;
  const isFaceDownDefense = currentCardState?.hidden && currentCardState?.rotation === -90;
  const isDraggingAny = !!activeCard;


////////// レンダリング //////////
  return (
    <DndContext 
    sensors={sensors} 
    collisionDetection={collisionDetectionStrategy} 
    onDragStart={handleDragStart} 
    onDragEnd={handleDragEnd}
    autoScroll={false} 
    >
      <div className="field-grid">
        <SortableContext items={allItemIds} strategy={rectSortingStrategy}>
          {/* 上部メニュー */}
          <div style={{gridArea: 'menu'}} className="display">
              <button onClick={openResetPopup} className="operation-button top-menu red">
                リセット
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2v2a8 8 0 1 0 4.5 1.385V8h-2V2h6v2H18a9.99 9.99 0 0 1 4 8" /></svg>
                </button>
              <span className="space"></span>
              <span className="space"></span>
            <div>
              <button onClick={undo} className="operation-button top-menu">
                <span>戻る</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M8 7v4L2 6l6-5v4h5a8 8 0 1 1 0 16H4v-2h9a6 6 0 0 0 0-12z" /></svg>
                </button>
              <button onClick={handleDiceRoll} className="operation-button top-menu" >
                {/* disabled={isLoading} */}
                <span>サイコロ</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.2em" viewBox="0 0 512 512"><path fill="currentColor" d="M440.88 129.37L288.16 40.62a64.14 64.14 0 0 0-64.33 0L71.12 129.37a4 4 0 0 0 0 6.9L254 243.85a4 4 0 0 0 4.06 0L440.9 136.27a4 4 0 0 0-.02-6.9M256 152c-13.25 0-24-7.16-24-16s10.75-16 24-16s24 7.16 24 16s-10.75 16-24 16m-18 118.81L54 163.48a4 4 0 0 0-6 3.46v173.92a48 48 0 0 0 23.84 41.39L234 479.48a4 4 0 0 0 6-3.46V274.27a4 4 0 0 0-2-3.46M96 368c-8.84 0-16-10.75-16-24s7.16-24 16-24s16 10.75 16 24s-7.16 24-16 24m96-32c-8.84 0-16-10.75-16-24s7.16-24 16-24s16 10.75 16 24s-7.16 24-16 24m266-172.49L274 271.56a4 4 0 0 0-2 3.45V476a4 4 0 0 0 6 3.46l162.15-97.23A48 48 0 0 0 464 340.86V167a4 4 0 0 0-6-3.49M320 424c-8.84 0-16-10.75-16-24s7.16-24 16-24s16 10.75 16 24s-7.16 24-16 24m0-88c-8.84 0-16-10.75-16-24s7.16-24 16-24s16 10.75 16 24s-7.16 24-16 24m96 32c-8.84 0-16-10.75-16-24s7.16-24 16-24s16 10.75 16 24s-7.16 24-16 24m0-88c-8.84 0-16-10.75-16-24s7.16-24 16-24s16 10.75 16 24s-7.16 24-16 24" /></svg>
                </button>
              <button onClick={handleCoinFlip} className="operation-button top-menu">
                  <span>コイン</span>
                 <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M6.315 5.022c-.473.386-.907.82-1.293 1.293L7.877 9.17A5 5 0 0 1 9.17 7.877zm9.808 9.808a5 5 0 0 1-1.293 1.293l2.855 2.855a9 9 0 0 0 1.293-1.293zm3.45 2.036l-2.952-2.952c.244-.59.379-1.236.379-1.914s-.135-1.324-.38-1.914l2.953-2.952A8.96 8.96 0 0 1 21 12a8.96 8.96 0 0 1-1.427 4.866M10.086 7.38L7.134 4.426A8.96 8.96 0 0 1 12 3a8.96 8.96 0 0 1 4.866 1.427L13.914 7.38A5 5 0 0 0 12 7c-.678 0-1.324.135-1.914.38M5.022 17.685c.386.473.82.907 1.293 1.293l2.855-2.855a5 5 0 0 1-1.293-1.293zM7 12c0-.678.135-1.324.38-1.914L4.426 7.134A8.96 8.96 0 0 0 3 12a8.96 8.96 0 0 0 1.427 4.866l2.952-2.952A5 5 0 0 1 7 12m9.866 7.573l-2.952-2.952A5 5 0 0 1 12 17a5 5 0 0 1-1.914-.38l-2.952 2.953A8.96 8.96 0 0 0 12 21a8.96 8.96 0 0 0 4.866-1.427M14.83 7.877a5 5 0 0 1 1.293 1.293l2.855-2.855a9 9 0 0 0-1.293-1.293z" /></svg>
              </button>
            </div>
          </div>
          
          {/* シングルカードゾーン（モンスター、魔法、フィールド）の描画 */}
          {Object.entries(gameState.zones).map(([id, card]) => (
              <FieldZones 
                key={id} 
                id={id} 
                label={id.toUpperCase()} 
                count={card ? 1 : 0}
                onContextMenu={handleContextMenu} 
                getCardState={getCardState}
                hoveredCardId={hoveredCardId}
                onMouseEnter={setHoveredCardId}
                onMouseLeave={() => setHoveredCardId(null)}
                isDraggingAny={isDraggingAny}
              >
                  <div className="single-card-zone">
                      {card && <SortableCard card={card} 
                      onContextMenu={handleContextMenu} 
                      cardState={getCardState(card.id)} 
                      isHovered={hoveredCardId === card.id} 
                      onMouseEnter={setHoveredCardId} 
                      onMouseLeave={() => setHoveredCardId(null)} isDraggingAny={isDraggingAny} 
                      style={{position: 'relative'}}/>}
                  </div>
              </FieldZones>
          ))}

          {/* 配列ゾーン（デッキ、手札、墓地など）の描画 */}
          <FieldZones id="deck" 
            cards={gameState.deck} 
            count={gameState.deck.length} 
            label="デッキ" 
            onContextMenu={handleContextMenu} 
            getCardState={getCardState} 
            hoveredCardId={hoveredCardId} 
            onMouseEnter={setHoveredCardId} 
            onMouseLeave={() => setHoveredCardId(null)} isDraggingAny={isDraggingAny} 
          />
          <FieldZones id="hand" 
          cards={gameState.hand} 
          count={gameState.hand.length} 
          label="手札" 
          onContextMenu={handleContextMenu} 
          getCardState={getCardState} 
          hoveredCardId={hoveredCardId} 
          onMouseEnter={setHoveredCardId} onMouseLeave={() => setHoveredCardId(null)} 
          isDraggingAny={isDraggingAny} />

       {/* ポップアップ表示中はフィールド上のカードを非表示にし、重複レンダリングを避ける */}
          <FieldZones id="grave" 
            cards={showGravePopup ? [] : gameState.grave} 
            // cards={gameState.grave} 
            count={gameState.grave.length} 
            label="墓地" 
            onContextMenu={handleContextMenu} 
            getCardState={getCardState} 
            onLabelClick={() => setShowGravePopup(true)}  
            hoveredCardId={hoveredCardId} 
            onMouseEnter={setHoveredCardId} 
            onMouseLeave={() => setHoveredCardId(null)} isDraggingAny={isDraggingAny} 
          />

          <FieldZones 
          id="extra" 
          cards={gameState.extra} 
          count={gameState.extra.length} 
          label="EX" 
          onContextMenu={handleContextMenu} 
          getCardState={getCardState} 
          hoveredCardId={hoveredCardId} 
          onMouseEnter={setHoveredCardId} 
          onMouseLeave={() => setHoveredCardId(null)} 
          isDraggingAny={isDraggingAny} />

          <FieldZones 
            id="free" 
            cards={gameState.free} 
            count={gameState.free.length} 
            label="フリーゾーン" 
            onContextMenu={handleContextMenu} 
            getCardState={getCardState} 
            hoveredCardId={hoveredCardId} 
            onMouseEnter={setHoveredCardId} 
            onMouseLeave={() => setHoveredCardId(null)} 
            isDraggingAny={isDraggingAny} 
          />

          {/* デッキ操作ボタン */}
          <div className="deck-buttons-container">
              <button onClick={handleSmartDraw} className="operation-button deck-menu">
                <span>通常ドロー</span>
                <img src={`${process.env.PUBLIC_URL}/draw.png`} alt="通常ドロー" style={{ width: '1.5em', height: '1.5em', marginLeft:'0.5em', opacity:'0.4'}}/>
              </button>
              <button onClick={()=> handleDraw(1)} className="operation-button deck-menu">
                <span>+１枚</span>
                <img src={`${process.env.PUBLIC_URL}/draw.png`} alt="通常ドロー" style={{ width: '1.5em', height: '1.5em', marginLeft:'0.5em', opacity:'0.4'}}/>
              </button>
              <button 
                onClick={handleSendTopToGrave} 
                className="operation-button deck-menu">
                  <span>トップを墓地へ</span>
                  <img src={`${process.env.PUBLIC_URL}/grave.png`} 
                  alt="トップを墓地へ" 
                  style={{ width: '1.5em', height: '1.5em', marginLeft:'0.5em',opacity:'0.4'}}/>
                </button>
              <button onClick={handleShuffle} className="operation-button deck-menu">
               <span>シャッフル</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.2em" viewBox="0 0 256 256"><path fill="currentColor" d="M237.66 178.34a8 8 0 0 1 0 11.32l-24 24A8 8 0 0 1 200 208v-16a72.15 72.15 0 0 1-57.65-30.14l-41.72-58.4A56.1 56.1 0 0 0 55.06 80H32a8 8 0 0 1 0-16h23.06a72.12 72.12 0 0 1 58.59 30.15l41.72 58.4A56.08 56.08 0 0 0 200 176v-16a8 8 0 0 1 13.66-5.66ZM143 107a8 8 0 0 0 11.16-1.86l1.2-1.67A56.08 56.08 0 0 1 200 80v16a8 8 0 0 0 13.66 5.66l24-24a8 8 0 0 0 0-11.32l-24-24A8 8 0 0 0 200 48v16a72.15 72.15 0 0 0-57.65 30.14l-1.2 1.67A8 8 0 0 0 143 107m-30 42a8 8 0 0 0-11.16 1.86l-1.2 1.67A56.1 56.1 0 0 1 55.06 176H32a8 8 0 0 0 0 16h23.06a72.12 72.12 0 0 0 58.59-30.15l1.2-1.67A8 8 0 0 0 113 149" /></svg>
              </button>
          </div>

          {/* フリーゾーン操作ボタン */}
          <div className="free-buttons-container">
              <button 
                onClick={handleReturnFreeToTop} 
                className="operation-button free-menu" 
                disabled={gameState.free.length === 0}
              >
                <span>デッキの上へ戻す</span>
              </button>
              <button 
                onClick={handleReturnFreeToBottom} 
                className="operation-button free-menu"
                disabled={gameState.free.length === 0}
              >
                <span>デッキ下へ戻す</span>
              </button>
          </div>
        </SortableContext>

          {/* 墓地ポップアップ */}
            {showGravePopup && (
            <div className="popup-overlay" 
            onClick={() => setShowGravePopup(false)}>
              <div className="popup" onClick={e => e.stopPropagation()}>
                <div className="popup-header">
                  <h3 className="popup-title">墓地 ({gameState.grave.length}枚)</h3>
                    <button 
                    className="close-button" 
                    onClick={() => setShowGravePopup(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" 
                        width="18px" 
                        height="18px" 
                        viewBox="0 0 24 24">
                        <path fill="none" 
                        stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M20 20L4 4m16 0L4 20" />
                      </svg></button>
                      
                </div>
                <div className="popup-content">
                      <div style={{position: 'relative', 
                        minHeight: `${Math.ceil(gameState.grave.length / (width < 490 ? 1 : 2)) * 130}px`}}>
                        {gameState.grave.map((card, i) => {
                          // レスポンシブ対応ロジック
                          let cardStyle: React.CSSProperties = {};
                          const isSmallScreen = width < 490; // タブレットサイズをブレークポイントに
                          if (isSmallScreen) {
                              // 画面が狭い場合：カードを1列で中央に配置
                              cardStyle = {
                                  position: 'absolute',
                                  top: `${i * 11}em`, // 縦の間隔を調整
                                  width: 'auto', // 横幅を親要素に対する割合で指定
                                  height: `10.8rem`,
                                  zIndex: i + 2,
                              };
                          } else {
                              // 画面が広い場合：従来の2列表示
                              cardStyle = {
                                  position: 'absolute',
                                  left: `${(i % 2) * 6.8}rem`,
                                  top: `${Math.floor(i / 2) * 10}rem`,
                                  zIndex: i + 2,
                                  width:'auto',
                                  height:'9.6rem',
                              };
                          }
                          return <SortableCard 
                            key={card.id} 
                            card={card}
                            style={cardStyle} 
                            onContextMenu={handleContextMenu} 
                            cardState={getCardState(card.id)} 
                            isHovered={hoveredCardId === card.id} 
                            onMouseEnter={setHoveredCardId} onMouseLeave={() => setHoveredCardId(null)} isDraggingAny={isDraggingAny} 
                            />
                        })}
                        </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* ドロップ時のアニメーションを無効化 
       */}
      <DragOverlay
        dropAnimation={null}
      >
        {activeCard ? (() => {
          const rotation = getCardState(activeCard.id).rotation;
          let transformString = `rotate(${rotation}deg)`;
          if (rotation !== 0) {
            transformString += ' translate(-50%, 50%)';
          }

          return (
            <img
              src={activeCard.src}
              alt="dragging card"
              className="card"
              style={{
                zIndex: 9999,
                transform: transformString,
              }}
            />
          );
        })() : null}
      </DragOverlay>

      {/* カード画像選択時ポップアップ */}
      {contextMenu && (
        <div 
        className="context-menu" 
        style={{top: contextMenu.y, left: contextMenu.x}} 
        onClick={e => e.stopPropagation()}>
            { (contextMenu.location.startsWith('monster') || contextMenu.location.startsWith('spell') || contextMenu.location.startsWith('field')) &&
                <button onClick={toggleDisplayMode} className="context-menu-button">
                  表示形式を変更
                </button>
            }
            {contextMenu.location.startsWith('monster') && (
                <button onClick={setFaceDownDefense} className="context-menu-button" disabled={isFaceDownDefense}>
                  裏側守備表示
                </button>
            )}
        </div>
      )}

      {/* サイコロ・コイン結果ポップアップ */}
      {resultPopupContent && (
      <div className="result-popup-overlay" onClick={() => setResultPopupContent(null)}>
        <div className="result-popup" onClick={(e) => e.stopPropagation()}>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '2.5em' }}>{resultPopupContent}</p>
          <button className="operation-button" style={{ width: '100px', margin: '0 auto'}} onClick={() => setResultPopupContent(null)}>
            OK
          </button>
        </div>
      </div>
      )}

      {/* リセット選択ポップアップ */}
      {isResetPopupOpen && (
        <div className="result-popup-overlay" onClick={() => setIsResetPopupOpen(false)}>
          <div className="result-popup" style={{padding: '2rem 3rem'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, fontSize: '2.2em' }}>リセットの種類を選択</h3>
            <p style={{fontSize: '1.8em'}}>どちらのリセットを実行しますか？</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
              <button 
                onClick={handleFullReset} 
                className="operation-button" 
                style={{width: '100%', padding: '1.5rem'}}
              >
                初期状態に戻す
              </button>
              <button 
                onClick={handleShuffleReset} 
                className="operation-button" 
                style={{width: '100%', padding: '1.5rem'}}
              >
                シャッフルしてリセット
              </button>
              <button 
                onClick={() => setIsResetPopupOpen(false)} 
                className="operation-button" 
                style={{width: '100%', padding: '1.5rem', backgroundColor: '#a8a8a8ff'}}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};
