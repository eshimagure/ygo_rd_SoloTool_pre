import React from 'react';
import { Tabs, TabItem } from './Tabs'; // 作成したTabsコンポーネントをインポート
import '../styles/InfoModal.css';

// コンテンツの定義
const termsContent = (
  <div>
    <p>
    <span className="indent"></span>本ツールをご利用いただく際は、以下のルールをお守りください。
    </p>
    <h4>ご利用について（OKなこと）</h4>
      <ul>
        <li>個人で練習や研究のために楽しむ範囲でのご利用。</li>
        <li>画面スクリーンショットの共有。パズルデュエルの作問などにご利用下さい。</li>
        <li>動画や配信での利用。（収益化しているチャンネルでの利用もOK）</li>
      </ul>

    <h4>禁止事項（やめてほしいこと）</h4>
      <ul>
        <li>特定の個人や団体への誹謗中傷、差別的な内容、他者を攻撃する目的のコンテンツでの利用。</li>
        <li>公序良俗に反するコンテンツでの利用。</li>
        <li>本ツールの改変なしでの再配布や販売。（本ツールを元に大幅な改変を加えたものについては言及しません）</li>
      </ul>

    <h4>お願いしたいこと（クレジット表記）</h4>
      <ul>
        <li>動画や配信でご利用の際は、動画の概要欄や配信の詳細情報欄など、視聴者が確認できる場所に、以下のクレジット（ツールの名称とURL）を記載してください。</li>
        <li><strong className='red'>【遊戯王ラッシュデュエル 一人回しツール Pre版】 https://ygo-rd-fansite.ltt.jp/SoloTool/pre/</strong></li>
      </ul>

    <h4>免責事項</h4>
      <ul>
        <li>本ツールの利用によって生じた、いかなるトラブルや損害について、当方は一切の責任を負いません。</li>
        <li>本規約は、予告なく変更される場合があります。予めご了承ください。</li>
      </ul>
  </div>
);

const qaContent = (
  <div>
    <h4>Q&A</h4>
     <ul>
        <li><strong>動画や配信で利用しても良いですか？</strong>
          <ul>
            <li>利用規約をお読みの上、サイトのURLを概要欄などわかりやすい箇所に記入して頂ければOKです。<br/><strong className='red'>【遊戯王ラッシュデュエル 一人回しツール Pre版】 https://ygo-rd-fansite.ltt.jp/SoloTool/pre/</strong>
            </li>
          </ul>
        </li>
        <li><strong>要望やバグ報告はどこに送ればいいですか？</strong>
          <ul>
            <li>ページ最下部に作者のプロフィールページがありますので、そこに記載されているX（旧Twitter）アカウントか、Waveboxまでご連絡下さい。</li>
          </ul>
        </li>
      </ul>
  </div>
);

const historyContent = (
  <div>
     <h3>Ver. 1.1.0 (2025-10-29)</h3>
      <ul>
        <li><strong>✨ 機能追加</strong>
          <ul>
            <li>「通常ドロー」ボタン追加</li>
            <li>リセットに「シャッフルしてリセット」機能追加</li>
            <li>画面・カードの表示レイアウトを一部変更</li>
          </ul>
        </li>
      </ul>
     <h3>Ver. 1.0.0 (2025-08-17)</h3>
      <ul>
        <li><strong>✨ 機能追加</strong>
          <ul>
            <li>「遊戯王ラッシュデュエル 一人回しツール Pre版」を公開しました。</li>
            <li>デッキ画像の自動切り出し、ドラッグ＆ドロップによるカード操作、サイコロ、コイントスなどの基本機能を搭載しています。</li>
          </ul>
        </li>
      </ul>
  </div>
);

// タブに渡すデータを作成
const tabItems: TabItem[] = [
  { label: '利用規約', content: termsContent },
  { label: 'Q&A', content: qaContent },
  { label: '更新履歴', content: historyContent },
];

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <h2>ツールについて</h2>
          <button onClick={onClose} className="info-modal-close-button">×</button>
        </div>
        <div className="info-modal-content">
          <Tabs items={tabItems} />
        </div>
      </div>
    </div>
  );
};
