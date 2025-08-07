// src/components/FieldZones.tsx
import React from 'react';
import { useSortable, 
  // SortableContext, 
  // rectSortingStrategy 
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

export const FieldZones: React.FC<FieldZonesProps> = ({ id, children, cards = [], count, label, hoveredCardId, isDraggingAny, onContextMenu, getCardState, onMouseEnter, onMouseLeave, onClick, onLabelClick }) => {
  const { setNodeRef, isOver } = useSortable({ id });
  const { width } = useWindowSize();
  const isMonsterZone = id.startsWith('monster');
  const zoneIdClass = `zone--${id.split(/[0-9]/)[0]}`; // monster1,2,3をmonsterにまとめる

  // const zoneStyle: React.CSSProperties = {
  //   backgroundColor: isOver ? '#eef2ff' : '',
  //   borderColor: isOver ? '#6366f1' : '',
  //   gridArea: id,
  // };

   const zoneStyle: React.CSSProperties = {
    // isOverがtrueの時、--zone-bg-over 変数を適用する
    backgroundColor: isOver ? 'var(--zone-bg-over)' : '',
    borderColor: isOver ? 'var(--zone-border-over)' : '',
    gridArea: id,
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
    <div 
    ref={setNodeRef} 
    style={zoneStyle} 
    onClick={onClick} 
    className={`zone ${isMonsterZone ? 'zone--monster' : ''} ${zoneIdClass}`}>
       {showLabelText && (
        <div className="zone-label" 
        onClick={handleLabelClick} 
        style={onLabelClick ? { cursor: 'pointer',backgroundColor:"#767676ff",color:"#efefef", bottom:"0.1rem",top:"auto"} : {}}>
          {isSingleCardZone ? label : labelText}
        </div>
      )}
      <div className="card-stack">
        {children}
        {cards.map((card, i) => {
           let cardStyle: React.CSSProperties = {};
            let cardNumber : number;
            let cardWidth: number;
            let cardHeight: number;
            let offsetX: string;
            let offsetY: string;
          // if (id === 'deck') {
          //   // 画面幅に応じたオフセット計算
          //   if (width < 450) {
          //     cardNumber = 10;
          //     cardWidth = 6;
          //     cardHeight = cardWidth *1.42;

          //     offsetX = (i % cardNumber) * -1.5 + 'rem';
          //     offsetY = Math.floor(i / cardNumber) * 0.5 + 'rem';
            // } else if (width < 450) {
            //   cardNumber = 8;
            //   cardWidth = 7.3;
            //   cardHeight = cardWidth *1.42;

            //   offsetX = (i % cardNumber) * -1.2 + 'rem';
            //   offsetY = Math.floor(i / cardNumber) * 0.5 + 'rem';
            // } else if (width < 576) {
            //   cardNumber = 8;
            //   cardWidth = 7.3;
            //   cardHeight = cardWidth *1.42;

            //   offsetX = (i % cardNumber) * -1.2 + 'rem';
            //   offsetY = Math.floor(i / cardNumber) * 0.5 + 'rem';
            // } else if (width < 680) {
            //   cardNumber = 12;
            //   cardWidth = 6.4;
            //   cardHeight = cardWidth *1.42;

            //   offsetX = (i % cardNumber) * -1.2 + 'rem';
            //   offsetY = Math.floor(i / cardNumber) * 0.5 + 'rem';
            // } else if (width < 767) {
            //   cardNumber = 12;
            //   cardWidth = 7;
            //   cardHeight = cardWidth *1.42;

            //   offsetX = (i % cardNumber) * -1.2 + 'rem';
            //   offsetY = Math.floor(i / cardNumber) * 0.5 + 'rem';
            // } else {
            //   cardNumber = 13;
            //   cardWidth = 6;
            //   cardHeight = cardWidth *1.42;

            //   offsetX = (i % cardNumber) * -1.2 + 'rem';
            //   offsetY = Math.floor(i / cardNumber) * 0.5 + 'rem';
            // }
            // スタイルを計算
            // cardStyle = {
            //   left: `calc(${(i % cardNumber) * cardWidth + 0.3 }rem + ${offsetX})`,
            //   top: `calc(${Math.floor(i / cardNumber) * cardHeight * 0.75}rem + ${offsetY})`,
            //   zIndex: i + 2,
            //   height: `${cardHeight}em`,
            //   width: `${cardWidth}em`,
            //   position: 'absolute', // position: absoluteを明示
            // };
            //  return (
            //   <SortableCard
            //     key={card.id}
            //     card={card}
            //     style={cardStyle}
            //     cardState={getCardState(card.id)}
            //     onContextMenu={onContextMenu}
            //     isHovered={hoveredCardId === card.id}
            //     onMouseEnter={onMouseEnter}
            //     onMouseLeave={onMouseLeave}
            //     isDraggingAny={isDraggingAny}
            //   />
            // ) }} else 
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
              left: `calc(${(i % cardNumber) * cardHeight/1.5 +0.3 }rem + ${offsetX})`,
              top: `calc(${Math.floor(i / cardNumber) * cardHeight*0.01}rem + ${offsetY})`,
              zIndex: 77- i - 2,
               height: `${cardHeight}em`,
              width: `${cardWidth}em`,
              position: 'absolute', // position: absoluteを明示
            };
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
                  // cardStyle = {
                    //     left: `${(i % 15) * 4.5 + 1.2 }em`,
                    //     top: `${Math.floor(i / 15) * 10.7}em`,
                    //     zIndex: 62 - i - 2,
                    //     width:'7.2em',
                    //     height:'10.5em',
                    // };

                // } else  if (id === 'hand') {
                //     let horizontalCards: number;
                //     let horizontalGap: number;
                //     let cardWidth: number;

                //     // 1. モバイル向けのブレークポイント (例: 600px未満)
                //     if (width < 767) {
                //         horizontalCards = 8; // 横に15枚
                //         horizontalGap = 8.2;
                //         cardWidth = 8;
                    
                //     // 2. タブレット向けのブレークポイント (例: 1024px未満)
                //     // } else if (width < 767) {
                //     //     horizontalCards = 12; // 横に15枚
                //     //     horizontalGap = 6.4;
                //     //     cardWidth = 7.2;
                    
                //     // 3. それ以外 (PC)
                //     } else {
                //         horizontalCards = 11; // 横に18枚
                //         horizontalGap = 6.05;
                //         cardWidth = 8;
                //     }
                //     cardStyle = {
                //         left: `${(i % horizontalCards) * parseFloat(`${horizontalGap}em`)+ 0.5}em`,
                //         top: `${Math.floor(i / horizontalCards) * cardWidth * 1.5 }em`,
                //         zIndex:  i + 2,
                //         width: `${cardWidth}em`,
                //         height: `calc(${cardWidth}em * 1.45)`,
                //     };
                // } else  if (id === 'extra') {
                //     let horizontalCards: number;
                //     let horizontalGap: number;
                //     let cardWidth: number;

                //     // 1. モバイル向けのブレークポイント (例: 600px未満)
                //     if (width < 767) {
                //         horizontalCards = 8; // 横に15枚
                //         horizontalGap = 8.2;
                //         cardWidth = 8;
                    
                //     // 2. タブレット向けのブレークポイント (例: 1024px未満)
                //     // } else if (width < 850) {
                //     //     horizontalCards = 15; // 横に15枚
                //     //     horizontalGap = 5.1;
                //     //     cardWidth = 6.5;
                    
                //     // 3. それ以外 (PC)
                //     } else {
                //         horizontalCards = 15; // 横に15枚
                //         horizontalGap = 4.45;
                //         cardWidth = 6;
                //     }
                //     cardStyle = {
                //         left: `${(i % horizontalCards) * parseFloat(`${horizontalGap}em`)+ 0.5}em`,
                //         top: `${Math.floor(i / horizontalCards) * cardWidth * 1.5 }em`,
                //         zIndex:  i + 2,
                //         width: `${cardWidth}em`,
                //         height: `calc(${cardWidth}em * 1.45)`,
                //     };
                // } else if (id === 'grave') {
                //     let horizontalCards: number;
                //     let horizontalGap: number;
                //     let cardWidth: number;

                //     // 1. モバイル向けのブレークポイント (例: 600px未満)
                //     if (width < 767) {
                //         horizontalCards = 3; // 縦枚数
                //         horizontalGap = 9;
                //         cardWidth = 8.3;
                    
                //     // 2. タブレット向けのブレークポイント (例: 1024px未満)
                //     // } else if (width < 850) {
                //     //     horizontalCards = 4; // 縦枚数
                //     //     horizontalGap = 6.1;
                //     //     cardWidth = 5.8;
                    
                //     // 3. それ以外 (PC)
                //     } else {
                //         horizontalCards = 3; // 横に18枚
                //         horizontalGap = 6.6;
                //         cardWidth = 6;
                //     }
                //     cardStyle = {
                //         left: `${Math.floor(i / horizontalCards) * cardWidth * 1.1 }em`,
                //         top: `${(i % horizontalCards) * parseFloat(`${horizontalGap}em`)}em`,
                //         zIndex:  i + 2,
                //         width: `${cardWidth}em`,
                //         height: `calc(${cardWidth}em * 1.45)`,
                //     };
                // }
             
