// // @dnd-kitではIDがstringまたはnumberである必要があるため、
// // ItemTypes.CARDはデータのtypeプロパティとして使用し、
// // id自体は一意の文字列を生成して使用します。
// src/types/types.ts

export interface Card {
  id: string;
  src: string;
}

export interface CardState {
  rotation: number;
  hidden: boolean;
}

export type ZoneName = 'monster1' | 'monster2' | 'monster3' | 'spell1' | 'spell2' | 'spell3' | 'field' | 'deck' | 'hand' | 'grave' | 'extra' | 'free';
export type ArrayZoneName = 'deck' | 'hand' | 'grave' | 'extra' | 'free';

export interface GameState {
  deck: Card[];
  hand: Card[];
  grave: Card[];
  extra: Card[];
  free: Card[];
  zones: Record<Exclude<ZoneName, ArrayZoneName>, Card | null>;
  cardStates: Record<string, CardState>;
}
