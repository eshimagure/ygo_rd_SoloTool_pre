// src/components/FieldLayout.tsx
import React, { useState, useEffect, useMemo } from 'react'; //, useMemo
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  // TouchSensor,
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

export const FieldLayout: React.FC<FieldLayoutProps> = ({ initialGameState }) => {
  const { width } = useWindowSize(); // 既存のフックを再利用
  const [history, setHistory] = useState<GameState[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, cardId: string, location: string } | null>(null);
  const [showGravePopup, setShowGravePopup] = useState(false);
   const [resultPopupContent, setResultPopupContent] = useState<string | null>(null);
    // 1. 初期化ロジック: localStorageからデータを読み込む
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const savedState = localStorage.getItem('rushDuelGameState');
      if (savedState) {
        // 保存されたデータがあれば、それを使って初期化
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to parse saved state:", error);
    }
    // 保存されたデータがなければ、propsの初期値を使う
    return initialGameState;
  });

 // 2. 保存ロジック: gameStateが変更されるたびにlocalStorageに保存する
  useEffect(() => {
    // gameStateが空でない場合のみ保存（初期化直後などを除く）
    if (gameState && gameState.deck.length > 0) {
      localStorage.setItem('rushDuelGameState', JSON.stringify(gameState));
    }
  }, [gameState]);

  // 3. propsの初期値が変更された場合（新しいデッキを読み込んだ場合）の処理
  useEffect(() => {
    // initialGameStateが空でない（＝新しいデッキが読み込まれた）場合、
    // gameStateを新しい初期値で上書きする
    if (initialGameState && initialGameState.deck.length > 0) {
      setGameState(initialGameState);
    }
  }, [initialGameState]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    // useSensor(TouchSensor, {
    //   activationConstraint: {
    //     delay: 150,
    //     tolerance: 30,
    //   },
    // })
  );

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCenter(args);
  };

  const saveHistory = () => setHistory(prev => [...prev, gameState]);
  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setGameState(lastState);
    setHistory(prev => prev.slice(0, -1));
  };
  // const resetGame = () => {
  //     if (window.confirm("デッキを読み込んだ直後の状態にリセットします。よろしいですか？")) {
  //     setGameState(initialGameState);
  //     setHistory([]);
  //   }
  // };

  const resetGame = () => {
     if (window.confirm("デッキを読み込んだ直後の状態にリセットします。よろしいですか？")) {
    // ★★★ リセット時にlocalStorageもクリアする ★★★
    localStorage.removeItem('rushDuelGameState'); 
    setGameState(initialGameState);
    setHistory([]);
     }
  };
  
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
  
  const handleDragStart = (event: DragStartEvent) => {
    const cardId = String(event.active.id);
    const card = 
        [...gameState.deck, ...gameState.hand, ...gameState.grave, ...gameState.extra, ...gameState.free, ...Object.values(gameState.zones).filter(Boolean)]
        .find(c => c && c.id === cardId);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    saveHistory();
    setGameState(prev => {
        const fromContainer = findCardLocation(activeId);
        const toContainer = findCardLocation(overId) || overId;
        
        if (!fromContainer) return prev;

        const singleCardZoneIds = ['field', 'monster1', 'monster2', 'monster3', 'spell1', 'spell2', 'spell3'];
        if (singleCardZoneIds.includes(toContainer) && prev.zones[toContainer as keyof typeof prev.zones]) {
            return prev;
        }
        
        const arrayContainers: ArrayZoneName[] = ['deck', 'hand', 'grave', 'extra', 'free'];
        const isFromContainerArray = arrayContainers.includes(fromContainer as ArrayZoneName);
        const isToContainerArray = arrayContainers.includes(toContainer as ArrayZoneName);

        if (fromContainer === toContainer && isFromContainerArray) {
            const containerKey = fromContainer as ArrayZoneName;
            const oldIndex = prev[containerKey].findIndex(c => c.id === activeId);
            const newIndex = prev[containerKey].findIndex(c => c.id === overId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newState = JSON.parse(JSON.stringify(prev));
                newState[containerKey] = arrayMove(prev[containerKey], oldIndex, newIndex);
                return newState;
            }
        }

        const newState = JSON.parse(JSON.stringify(prev));
        const card = [...prev.deck, ...prev.hand, ...prev.grave, ...prev.extra, ...prev.free, ...Object.values(prev.zones).filter(Boolean)].find(c => c && c.id === activeId);
        if (!card) return prev;

     // もしカードがシングルカードゾーンから移動された場合、そのカードの状態をリセットする
        if (singleCardZoneIds.includes(fromContainer)) {
            newState.cardStates[activeId] = { rotation: 0, hidden: false };
        }

        if (isFromContainerArray) {
            const containerKey = fromContainer as ArrayZoneName;
            newState[containerKey] = newState[containerKey].filter((c: Card) => c.id !== activeId);
        } else {
            newState.zones[fromContainer as keyof typeof newState.zones] = null;
        }

        if (isToContainerArray) {
            const containerKey = toContainer as ArrayZoneName;
            const targetArray: Card[] = newState[containerKey];
            const overIsCard = findCardLocation(overId) === containerKey;

            if (containerKey === 'deck') {
                if (overIsCard) {
                    targetArray.unshift(card);
                } else {
                    targetArray.push(card);
                }
            } else {
                const overIndex = targetArray.findIndex((c: Card) => c.id === overId);
                if (overIndex !== -1) {
                     targetArray.splice(overIndex + 1, 0, card);
                } else {
                     targetArray.push(card);
                }
            }
        } else {
            newState.zones[toContainer as keyof typeof newState.zones] = card;
            // 新しいゾーンに置かれたカードの状態も初期化
            newState.cardStates[card.id] = { rotation: 0, hidden: false };
        }
        return newState;
    });
  };

  const handleDraw = (count: number) => {
    if (gameState.deck.length < count) return;
    saveHistory();
    setGameState(prev => {
        const drawn = prev.deck.slice(0, count);
        return { ...prev, deck: prev.deck.slice(count), hand: [...prev.hand, ...drawn] };
    });
  };

  const handleShuffle = () => {
     if (window.confirm("デッキをシャッフルしますか？")) {
      saveHistory();
      setGameState(prev => ({ ...prev, deck: [...prev.deck].sort(() => Math.random() - 0.5) }));
    }
  };

  // ★★★★★ ここから追加 ★★★★★
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
  // ★★★★★ ここまで追加 ★★★★★
  
  const handleSendTopToGrave = () => {
    if (gameState.deck.length === 0) return;
    saveHistory();
    setGameState(prev => {
        const topCard = prev.deck[0];
        return { ...prev, deck: prev.deck.slice(1), grave: [topCard, ...prev.grave] };
    });
  };

  // const handleDiceRoll = () => {
  //   setIsLoading(true);
  //   setDiceResult(null);
  //   setCoinResult(null);
  //   setTimeout(() => {
  //       setDiceResult(Math.floor(Math.random() * 6) + 1);
  //       setIsLoading(false);
  //   }, 1000);
  // };

  // const handleCoinFlip = () => {
  //   setIsLoading(true);
  //   setDiceResult(null);
  //   setCoinResult(null);
  //   setTimeout(() => {
  //       setCoinResult(Math.random() < 0.5 ? '表' : '裏');
  //       setIsLoading(false);
  //   }, 1000);
  // };
    const handleDiceRoll = () => {
    const result = Math.floor(Math.random() * 6) + 1;
    setResultPopupContent(`サイコロの目は「${result}」です`);
  };

  const handleCoinFlip = () => {
    const result = Math.random() < 0.5 ? '表' : '裏';
    setResultPopupContent(`コインの結果は「${result}」です`);
  };


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
  // ★★★★★ ここまで修正 ★★★★★

  const closeContextMenu = () => setContextMenu(null);
  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  const toggleDisplayMode = () => {
    if (!contextMenu) return;
    saveHistory();
    const { cardId, location } = contextMenu;
    setGameState(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const cardState = newState.cardStates[cardId] || { rotation: 0, hidden: false };
        
        if (location.startsWith('monster')) {
            if (cardState.hidden) {
                cardState.rotation = 0;
                cardState.hidden = false;
            } else if (cardState.rotation === 0) {
                cardState.rotation = -90;
            } else {
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

  const setFaceDownDefense = () => {
    if (!contextMenu) return;
    saveHistory();
    const { cardId } = contextMenu;
    setGameState(prev => ({ ...prev, cardStates: { ...prev.cardStates, [cardId]: { rotation: -90, hidden: true } } }));
    closeContextMenu();
  };
  
  const getCardState = (cardId: string): CardState => gameState.cardStates[cardId] || { rotation: 0, hidden: false };

  const allItemIds = useMemo(() => {
    const zoneCards = Object.values(gameState.zones).filter(Boolean).map(c => c!.id);
    return [
        ...Object.keys(gameState.zones), 'deck', 'hand', 'grave', 'extra', 'free',
        ...gameState.deck.map(c => c.id), ...gameState.hand.map(c => c.id),
        ...gameState.grave.map(c => c.id), ...gameState.extra.map(c => c.id),
        ...gameState.free.map(c => c.id),
        ...zoneCards
    ];
  }, [gameState]);

  const currentCardState = contextMenu ? getCardState(contextMenu.cardId) : null;
  const isFaceDownDefense = currentCardState?.hidden && currentCardState?.rotation === -90;
  const isDraggingAny = !!activeCard;

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
          <div style={{gridArea: 'menu', padding: '0.5em'}}>
             {/* <div className='utility'>
               {isLoading ? '・・・' : (
                    <>
                        {diceResult && `🎲： ${diceResult}`}
                        {coinResult && `コイン： ${coinResult}`}
                    </>
                )}
            </div> */}
              <button onClick={resetGame} className="operation-button top-menu">
                リセット
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2v2a8 8 0 1 0 4.5 1.385V8h-2V2h6v2H18a9.99 9.99 0 0 1 4 8" /></svg>
                </button>
              <span className="space"></span>
              <span className="space"></span>
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

          <div className="deck-buttons-container">
              <button onClick={() => handleDraw(1)} className="operation-button deck-menu">
                <span>1枚ドロー</span>
                <img src={`${process.env.PUBLIC_URL}/draw.png`} alt="1ドロー" style={{ width: '1.5em', height: '1.5em', marginLeft:'0.5em'}}/>
                </button>
              <button 
                onClick={handleSendTopToGrave} 
                className="operation-button deck-menu">
                  <span>トップを墓地へ</span>
                  <img src={`${process.env.PUBLIC_URL}/grave.png`} 
                  alt="トップを墓地へ" 
                  style={{ width: '1.5em', height: '1.5em', marginLeft:'0.5em'}}/>
                </button>
              <button onClick={handleShuffle} className="operation-button deck-menu">
               <span>シャッフル</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.2em" viewBox="0 0 256 256"><path fill="currentColor" d="M237.66 178.34a8 8 0 0 1 0 11.32l-24 24A8 8 0 0 1 200 208v-16a72.15 72.15 0 0 1-57.65-30.14l-41.72-58.4A56.1 56.1 0 0 0 55.06 80H32a8 8 0 0 1 0-16h23.06a72.12 72.12 0 0 1 58.59 30.15l41.72 58.4A56.08 56.08 0 0 0 200 176v-16a8 8 0 0 1 13.66-5.66ZM143 107a8 8 0 0 0 11.16-1.86l1.2-1.67A56.08 56.08 0 0 1 200 80v16a8 8 0 0 0 13.66 5.66l24-24a8 8 0 0 0 0-11.32l-24-24A8 8 0 0 0 200 48v16a72.15 72.15 0 0 0-57.65 30.14l-1.2 1.67A8 8 0 0 0 143 107m-30 42a8 8 0 0 0-11.16 1.86l-1.2 1.67A56.1 56.1 0 0 1 55.06 176H32a8 8 0 0 0 0 16h23.06a72.12 72.12 0 0 0 58.59-30.15l1.2-1.67A8 8 0 0 0 113 149" /></svg>
              </button>
          </div>

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
                          width="2rem" 
                          height="2rem" 
                          viewBox="0 0 24 24">
                          <path fill="none" 
                          stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M20 20L4 4m16 0L4 20" />
                        </svg></button>
                  </div>
                  <div className="popup-content">
                        <div style={{position: 'relative', 
                          minHeight: `${Math.ceil(gameState.grave.length / (width < 490 ? 1 : 2)) * 130}px`}}>
                         {gameState.grave.map((card, i) => {
                           // ★★★ ここからがレスポンシブ対応のロジック ★★★
                           let cardStyle: React.CSSProperties = {};
                           const isSmallScreen = width < 490; // タブレットサイズをブレークポイントに

                           if (isSmallScreen) {
                               // 画面が狭い場合：カードを1列で中央に配置
                               cardStyle = {
                                   position: 'absolute',
                                   top: `${i * 11}em`, // 縦の間隔を調整
                                  //  left: '50%',
                                  // transform: 'translateX(-50%)', // 中央揃え
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
                           // ★★★ ここまで ★★★
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
      <DragOverlay
        // ★★★★★ ドロップ時のアニメーションを無効化 ★★★★★
        dropAnimation={null}
      >
        {activeCard ? (() => {
          const rotation = getCardState(activeCard.id).rotation;
          
          // 中央揃えのスタイル（transform: translate を使う方法に戻します）
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

      {contextMenu && (
        <div 
        className="context-menu" 
        style={{top: contextMenu.y, left: contextMenu.x}} 
        onClick={e => e.stopPropagation()}>
            { (contextMenu.location.startsWith('monster') || contextMenu.location.startsWith('spell') || contextMenu.location.startsWith('field')) &&
                <button onClick={toggleDisplayMode} className="context-menu-button">表示形式を変更</button>
            }
            {contextMenu.location.startsWith('monster') && (
                <button onClick={setFaceDownDefense} className="context-menu-button" disabled={isFaceDownDefense}>裏側守備表示</button>
            )}
        </div>
      )}
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
    </DndContext>
  );
};
