// src/components/SortableCard.tsx
import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities'; //カードプレビューの挙動原因
import { Card, CardState } from '../types';

interface SortableCardProps {
  card: Card;
  style?: React.CSSProperties;
  cardState?: CardState;
  isHovered: boolean;
  isDraggingAny: boolean; // 他のカードがドラッグ中かどうかのフラグ
  onContextMenu: (e: React.MouseEvent, cardOrZoneId: Card | string) => void;
  
  onMouseEnter: (cardId: string) => void; //
  onMouseLeave: () => void; //
}

  //isDraggingAny
export const SortableCard: React.FC<SortableCardProps> = ({ card, style, cardState, isHovered , onContextMenu, onMouseEnter, onMouseLeave }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    // transform,
    // transition,
    isDragging,
  } = useSortable({ 
    id: card.id,
    // disabled: isDraggingAny,  //アニメーションをより直接的に制御するため、disabledは削除
  });

const stateStyle: React.CSSProperties = {
      transform: `rotate(${cardState?.rotation || 0}deg)`,
      filter: cardState?.hidden ? 'brightness(0.4)' : 'none',
  };

//// カード画像をhoverした時の挙動
  const hoverStyle: React.CSSProperties = isHovered && !isDragging ? {
    transform: `translateY(-0.5em) rotate(${cardState?.rotation || 0}deg)`,
    zIndex: 900,
  } : {};

    // ★★★★★ ここから追加 ★★★★★
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef(0);

  const handleTap = (e: React.TouchEvent | React.MouseEvent) => {
    const currentTime = new Date().getTime();
    const timeSinceLastTap = currentTime - lastTapTime.current;

    // 300ms以内に2回目のタップがあればダブルタップとみなす
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
      lastTapTime.current = 0;
      // ダブルタップ時にContextMenuを呼び出す
      onContextMenu(e as React.MouseEvent, card); 
    } else {
      // シングルタップの処理（もしあれば）
      lastTapTime.current = currentTime;
    }
  };
  // ★★★★★ ここまで追加 ★★★★★
  
  // 他のカードがドラッグされている場合、このカードの移動アニメーションを無効化する
  // const finalTransform = isDraggingAny && !isDragging ? null : transform;
  // const finalTransition = isDraggingAny && !isDragging ? 'transform 0s' : transition;

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...stateStyle,
    // transform: CSS.Transform.toString(finalTransform) 
    // ? `${CSS.Transform.toString(finalTransform)} rotate(${cardState?.rotation || 0}deg)` : stateStyle.transform,
    // transition: isDragging ? 'none' : finalTransition,
    opacity: isDragging ? 0.5 : 1,
    ...hoverStyle,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={combinedStyle} 
      className="card" 
      {...attributes} 
      {...listeners} 
      onContextMenu={(e) => onContextMenu(e, card)}
      onMouseEnter={() => onMouseEnter(card.id)}
      onMouseLeave={onMouseLeave}
      onTouchEnd={handleTap} // ★★★★★ スマートフォン用にonTouchEndを追加 ★★★★★
       //onClick={handleTap} // クリックでも反応させたい場合はこちらも有効化
    >
      <img src={card.src} alt="card" style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
    </div>
  );
};
