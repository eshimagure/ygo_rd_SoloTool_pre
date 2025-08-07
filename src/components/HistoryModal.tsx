import React from 'react';
import '../styles/HistoryModal.css'; // 後ほど作成するCSSファイルをインポート

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <h2>更新履歴・Q&A</h2>
          <button onClick={onClose} className="history-modal-close-button">×</button>
        </div>
        <div className="history-modal-content">
            {/* <div className="modal-nav-links">
                <a href="#history">更新履歴へ</a>
                <a href="#QandA">Q&Aへ</a>
            </div> */}
        <h2 id="QandA">Q&A</h2>
            <section>
            <ul>
              <li><strong>動画や配信で利用しても良いですか？</strong>
                <ul>
                  <li>サイトのURLを概要欄など、わかりやすい箇所に記入して頂ければOKです。<br/><strong className='red'>【遊戯王ラッシュデュエル 一人回しツール】 https://ygo-rd-fansite.ltt.jp/SoloTool/pre/</strong>
                  </li>
                  <li>ネガティブな内容のコンテンツに使用することはNGです。</li>
                </ul>
              </li>
              <li><strong>要望やバグ報告はどこに送ればいいですか？</strong>
                <ul>
                  <li>ページ最下部に作者のプロフィールページがありますので、そこに記載されているX（旧Twitter）アカウントか、Waveboxまでご連絡下さい。</li>
                </ul>
              </li>
            </ul>
          </section>

          <hr />
                <h2 id='history'>更新履歴</h2>

{/* 
          <section>
            <h3>Ver. 1.2.0 (2025-08-07)</h3>
            <p>より直感的で、様々な環境で使いやすくなるようにUIの改善を行いました。</p>
            <ul>
              <li><strong>✨ 機能追加</strong>
                <ul>
                  <li>ハンバーガーメニューに「使い方ガイド」「更新履歴」などの項目を追加しました。</li>
                  <li>フリーゾーンを追加し、カードを一時的に保持できるようにしました。</li>
                  <li>フリーゾーンのカードをデッキの上または下に戻す機能を追加しました。</li>
                </ul>
              </li>
              <li><strong>🔧 改善</strong>
                <ul>
                  <li>ダークモードに対応しました。OSの表示設定に連動してテーマが切り替わります。</li>
                  <li>画面幅に応じてレイアウトが自動調整されるレスポンシブデザインを導入しました。</li>
                  <li>スクロール可能なゾーンのラベルが、スクロールに追従せず右上に固定されるようにしました。</li>
                  <li>デッキや墓地ゾーンで、カードが折り返して表示されるようにレイアウトを改善しました。</li>
                </ul>
              </li>
              <li><strong>🕷 不具合修正</strong>
                <ul>
                  <li>スクロール可能なゾーン内で、カードのドラッグとページのスクロールが競合して操作しづらくなる問題を修正しました。</li>
                  <li>ページを離れてもゲームの状態が保持されるように`localStorage`に保存する機能を追加しました。</li>
                </ul>
              </li>
            </ul>
          </section> */}

          <section>
            <h3>Ver. 1.0.0 (2025-08-05)</h3>
            <ul>
              <li><strong>✨ 機能追加</strong>
                <ul>
                  <li>「遊戯王ラッシュデュエル 一人回しツール」を公開しました。</li>
                  <li>デッキ画像の自動切り出し、ドラッグ＆ドロップによるカード操作、サイコロ、コイントスなどの基本機能を搭載しています。</li>
                </ul>
              </li>
            </ul>
          </section>

        <hr />
  
        </div>
      </div>
    </div>
  );
};