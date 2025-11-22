// src/components/SortableCard.tsx
import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Card, CardState } from '../types';

interface SortableCardProps {
  card: Card;
  style?: React.CSSProperties; // 親(FieldZones)から渡されるレイアウト用スタイル
  cardState?: CardState; // カードの状態（向き、裏表）
  isHovered: boolean; // ホバーされているかどうかのフラグ
  isDraggingAny: boolean; // 他のカードがドラッグ中かどうかのフラグ
  onContextMenu: (e: React.MouseEvent, cardOrZoneId: Card | string) => void;
  onMouseEnter: (cardId: string) => void;
  onMouseLeave: () => void;
}

/**
 * ドラッグ＆ドロップ可能なカード一枚を描画するコンポーネント
 * - dnd-kitの'useSortable'フックと連携
 * - カードの状態(cardState)に基づき、回転や明るさを適用
 * - ホバーエフェクト
 * - スマートフォンでのダブルタップを検知し、onContextMenuを呼び出す
 */
export const SortableCard: React.FC<SortableCardProps> = ({ card, style, cardState, isHovered , onContextMenu, onMouseEnter, onMouseLeave }) => {
  // dnd-kitフック
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,  // このカード自身がドラッグ中か
  } = useSortable({ 
    id: card.id,
    // disabled: isDraggingAny,  //アニメーションをより直接的に制御するため、disabledは削除
  });
  
  // カードの状態（向き、裏表）をCSSに反映
  const stateStyle: React.CSSProperties = {
      transform: `rotate(${cardState?.rotation || 0}deg)`,
      filter: cardState?.hidden ? 'brightness(0.4)' : 'none',
  };

  // カード画像をhoverした時の挙動（少し上に浮き上がる）
  const hoverStyle: React.CSSProperties = isHovered && !isDragging ? {
    transform: `translateY(-0.5em) rotate(${cardState?.rotation || 0}deg)`,
    zIndex: 900, // ホバー時に最前面に
  } : {};

  // スマートフォンでのダブルタップ検知ロジック
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef(0);

  const handleTap = (e: React.TouchEvent | React.MouseEvent) => {
    const currentTime = new Date().getTime();
    const timeSinceLastTap = currentTime - lastTapTime.current;

    // 300ms以内（かつ0msより大きい）のタップをダブルタップとみなす
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
      lastTapTime.current = 0;
      // ダブルタップ時にPCの右クリック相当(onContextMenu)の処理を呼び出す
      onContextMenu(e as React.MouseEvent, card); 
    } else {
      // シングルタップの処理（もしあれば）
      lastTapTime.current = currentTime;
    }
  };
  
  // 親から渡されたレイアウトスタイル、状態スタイル、ホバースタイルを結合
  const combinedStyle: React.CSSProperties = {
    ...style,
    ...stateStyle,
    opacity: isDragging ? 0.5 : 1, // ドラッグ中は半透明に
    ...hoverStyle,
  };

  return (
    <div 
      ref={setNodeRef}  // dnd-kitがDOMを参照するために必要
      style={combinedStyle} 
      className="card" 
      {...attributes} // ドラッグハンドル用の属性
      {...listeners} // ドラッグイベントリスナー
      onContextMenu={(e) => onContextMenu(e, card)} // PC: 右クリック
      onMouseEnter={() => onMouseEnter(card.id)}
      onMouseLeave={onMouseLeave}
      onTouchEnd={handleTap} // スマホ: タップ（ダブルタップ検知用）
    >
      <img src={card.src} alt="card" style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
    </div>
  );
};
