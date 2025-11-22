// src/components/FieldZones.tsx
import React, { useState, useRef, useLayoutEffect } from 'react';
import { useSortable, 
} from '@dnd-kit/sortable';
import { Card, CardState } from '../types';
import { SortableCard } from './SortableCard';
import { useWindowSize } from '../hooks/useWindowSize';

interface FieldZonesProps {
  id: string;
  children?: React.ReactNode;
  cards?: Card[];
  count: number;
  label: string;
  hoveredCardId: string | null;
  isDraggingAny: boolean;
  onContextMenu: (e: React.MouseEvent, cardOrZoneId: Card | string) => void;
  getCardState: (cardId: string) => CardState | undefined;
  onMouseEnter: (cardId: string) => void;
  onMouseLeave: () => void;
  onClick?: () => void;
  onLabelClick?: (e: React.MouseEvent) => void;
}

/**
 * 各ゾーン（デッキ、手札、墓地、モンスターゾーンなど）の描画とレイアウトを担当するコンポーネント
 * - dnd-kitのドロップ先(Sortable)として機能
 * - ResizeObserverを使い、ゾーンの幅をリアルタイムで取得
 * - ゾーンの幅に基づき、'deck'と'extra'のカードレイアウトを動的に計算・描画
 */
export const FieldZones: React.FC<FieldZonesProps> = ({ id, children, cards = [], count, label, hoveredCardId, isDraggingAny, onContextMenu, getCardState, onMouseEnter, onMouseLeave, onClick, onLabelClick }) => {
  const { setNodeRef, isOver } = useSortable({ id }); // dnd-kit用フック（このコンポーネントをドロップ可能な領域として設定）
  const { width } = useWindowSize();  // 'grave'ゾーンのレスポンシブ対応で使用 画面幅の検知
  const isMonsterZone = id.startsWith('monster');
  const zoneIdClass = `zone--${id.split(/[0-9]/)[0]}`; // monster1,2,3をmonsterにまとめる

  // 1. ゾーンのDOM要素（div）への参照を作成
  const zoneRef = useRef<HTMLDivElement>(null);
  // 2. ゾーンの幅を保存するためのstateを定義
  const [zoneWidth, setZoneWidth] = useState(0);
  // 3. ResizeObserverを使ってゾーンの幅を監視する副作用フック
  useLayoutEffect(() => {
    // zoneRef.current が要素を掴んだら処理開始（refがDOM要素を指している場合のみ実行）
    if (zoneRef.current) {
      // 要素のサイズが変更されたときにコールバックを実行するResizeObserverを作成し、要素のサイズが変わるたびに実行
      const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
          // 検出した幅をstateに保存
          setZoneWidth(entries[0].contentRect.width);
        }
      });
      // 監視を開始
      resizeObserver.observe(zoneRef.current);
      // コンポーネントが不要になったら監視を解除
      return () => resizeObserver.disconnect();
    }
  }, []); // このフックは最初に一度だけ実行

  const zoneStyle: React.CSSProperties = {
    // isOverがtrueの時、--zone-bg-over 変数を適用する
    backgroundColor: isOver ? 'var(--zone-bg-over)' : '', // ドラッグオーバー時の背景色
    borderColor: isOver ? 'var(--zone-border-over)' : '',
    gridArea: id, // CSS Gridの配置エリア
  };

  const singleCardZoneIds = ['field', 'monster1', 'monster2', 'monster3', 'spell1', 'spell2', 'spell3'];
  const isSingleCardZone = singleCardZoneIds.includes(id);
  const showLabelText = !isSingleCardZone;
  const labelText = {
      deck: `デッキ(${count})`,
      hand: `手札(${count})`,
      grave: `墓地(${count})`,
      extra: `EX(${count})`,
      free: `フリー(${count})`,
  }[id] || label;

  const handleLabelClick = (e: React.MouseEvent) => {
    if (onLabelClick) {
      e.stopPropagation();
      onLabelClick(e);
    }
  };

  return (
    // 4. refを監視対象のdivにアタッチ
    <div 
     ref={(instance) => {
    setNodeRef(instance); // dnd-kit用
    zoneRef.current = instance; // field-grid 幅サイズ監視用（ResizeObserver用）
  }} 
    style={zoneStyle} 
    onClick={onClick} 
    className={`zone ${isMonsterZone ? 'zone--monster' : ''} ${zoneIdClass}`}>
       {showLabelText && (
        <div className="zone-label" 
        onClick={handleLabelClick} 
        style={onLabelClick ? { cursor: 'pointer',backgroundColor:"#767676ff",color:"#efefef",} : {}}>
          {isSingleCardZone ? label : labelText}
        </div>
      )}

      {/*  親要素に position: 'relative' を設定  */}
      <div className="card-stack" style={{ position: 'relative' }}>
        {/* childrenはシングルカードゾーン(monster1など)のカード表示用 */}
        {children}
        {/* cards配列を持つゾーン(deck, handなど)のカード描画 */}
        {cards.map((card, i) => {
          //  5. デッキゾーンの動的レイアウト
          if (id === 'deck') {
            const total = cards.length;
            if (total === 0) return null; // 幅が未取得なら描画しない

            // レイアウト用のパラメータ（お好みで調整）
            // カード画像の画像を横幅を 画面幅の10等分と定義
            // ガード画像の画像縦幅は 横幅の1.45倍と定義
            const cardWidth = zoneWidth / 10;
            const cardHeight = cardWidth*1.45 ;
            if (zoneWidth === 0) return null;

            const cardStyle: React.CSSProperties = {
                position: 'absolute',
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                zIndex: 61-i,
            };

            // カードを3つのグループに分類
            const isTopRow = i < 7;
            const isBottomRow = (total <= 14 && i >= 7) || (total > 14 && i >= total - 7);
            // const isMiddleRow = !isTopRow && !isBottomRow;

            if (isTopRow) {
                // --- 上段（左寄せ） ---
                cardStyle.top = '0';
                cardStyle.left = `${i * cardWidth}px`; //${i * (cardWidth + spacing)}rem
                
            } else if (isBottomRow) {
                // --- 下段（右寄せ） ---
                const startIndex = total > 14 ? total - 7 : 7;
                const bottomIndex = i - startIndex ; //
                
                cardStyle.top = ` ${cardHeight * 2 }px`; 
                cardStyle.left = `${bottomIndex * cardWidth + zoneWidth/3.5}px`;

            } else { 
              // isMiddleRow
                // --- 中段（中央寄せ・グリッド表示） ---
                cardStyle.top = `${cardHeight}px`; 
                cardStyle.left = `${ (1.18*i*zoneWidth / total) -cardWidth/0.72 }px`;
            }
             return (
            //デッキのカードレイアウト
            <SortableCard
                key={card.id}
                card={card}
                style={cardStyle}
                cardState={getCardState(card.id)}
                onContextMenu={onContextMenu}
                isHovered={hoveredCardId === card.id}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                isDraggingAny={isDraggingAny}
            />)
          }
          // 6. EXデッキゾーンの動的レイアウト
          if (id === 'extra') {
            const total = cards.length;
            if (total === 0) return null; // カードがない場合は何も表示しない

            let cardWidth ;
            let cardHeight ;

            const cardStyle: React.CSSProperties = {
              position: 'absolute',
              top: 0,
              zIndex: 15 - i,
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
            };
            if (zoneWidth === 0) {
              return null; 
            // ゾーンの幅に応じてレイアウト（重なり具合）を変更
            }else if (zoneWidth > 526) {
              cardWidth = zoneWidth / 10;
              cardHeight = cardWidth*1.45 ;
              cardStyle.left = `${ i * cardWidth/1.6 }px`;
            }else if (zoneWidth > 390) {
              cardWidth = zoneWidth / 8;
              cardHeight = cardWidth*1.45 ;
              cardStyle.left = `${ i * cardWidth/2 }px`;
            }  else {
              cardWidth = zoneWidth / 5;
              cardHeight = cardWidth*1.45 ;
              cardStyle.left = `${ i * cardWidth/3.2 }px`;
              // cardStyle.top = `0.5rem`;
            }
            //EXデッキのカードレイアウト
            return (
              <SortableCard
                key={card.id}
                card={card}
                style={cardStyle}
                cardState={getCardState(card.id)}
                onContextMenu={onContextMenu}
                isHovered={hoveredCardId === card.id}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                isDraggingAny={isDraggingAny}
              />
            );
          }
            let cardStyle: React.CSSProperties = {};
            let cardNumber : number;
            let cardWidth: number;
            let cardHeight: number;
            let offsetX: string;
            let offsetY: string;

          // 7. 墓地ゾーンのレイアウト（画面幅で分岐）
            if (id === 'grave') {
              if (width < 450) {
                cardNumber = 1;
                cardWidth = 6.5;
                cardHeight = cardWidth *1.42;
                offsetX = (i % cardNumber) * 0.3 + 'rem';
                offsetY = Math.floor(i / cardNumber) * 0.1 + 'rem';
              } else if (width < 576) {
                cardNumber = 1;
                cardWidth = 7.5;
                cardHeight = cardWidth *1.42;
                offsetX = (i % cardNumber) * 0.3 + 'rem';
                offsetY = Math.floor(i / cardNumber) * 0.1 + 'rem';
              } else {
                cardNumber = 1;
                cardWidth = 7.2;
                cardHeight = cardWidth *1.42;
                offsetX = (i % cardNumber) * 0.3 + 'rem';
                offsetY = Math.floor(i / cardNumber) * 0.1 + 'rem';
              }
              cardStyle = {
                left: `calc(${(i % cardNumber) * cardHeight/1.5 + 0.3 }rem + ${offsetX})`,
                top: `calc(${Math.floor(i / cardNumber) * cardHeight*0.01}rem + ${offsetY})`,
                zIndex: 77- i - 2,
                height: `${cardHeight}em`,
                width: `${cardWidth}em`,
                position: 'absolute', // position: absoluteを明示
              };
              //墓地のカードレイアウト
              return (
                <SortableCard
                  key={card.id}
                  card={card}
                  style={cardStyle}
                  cardState={getCardState(card.id)}
                  onContextMenu={onContextMenu}
                  isHovered={hoveredCardId === card.id}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  isDraggingAny={isDraggingAny}
                />
              );
            }

          //  8. その他のゾーン（手札、フリーゾーン）
          // スタイル指定なし（CSS側でflexboxなどで並べる）
          return (
              <SortableCard
                key={card.id}
                card={card}
                cardState={getCardState(card.id)}
                onContextMenu={onContextMenu}
                isHovered={hoveredCardId === card.id}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                isDraggingAny={isDraggingAny}
              />
            );
        })}
      </div>
    </div>
  ); //return
};