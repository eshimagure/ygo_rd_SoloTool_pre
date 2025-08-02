import React from 'react';
import '../styles/GuideModal.css'; // 後ほど作成するCSSファイルをインポート

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null; // isOpenがfalseなら何も表示しない
  }

  return (
    // 背景のオーバーレイ。クリックするとモーダルが閉じる
    <div className="guide-modal-overlay" onClick={onClose}>
      {/* モーダル本体。クリックイベントが背景に伝播しないようにする */}
      <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="guide-modal-header">
          <h2>使い方ガイド</h2>
          <button onClick={onClose} className="guide-modal-close-button">×</button>
        </div>
        <div className="guide-modal-content">
          <h3>1. デッキの読み込み</h3>
          <p><span className="indent"></span>ニューロンからデッキの「画像共有」から作成した画像をアップロードしてください。自動的にカードが切り出されます。<br/>
          ※トリミング等の加工をした画像・他の形式のデッキ画像は読み込めません。
          </p>
          <div className="guide-img">
            <img src={`${process.env.PUBLIC_URL}/images/000.jpg`} alt="説明画像01"/>
          </div>
          <div className="guide-img">
            <img src={`${process.env.PUBLIC_URL}/images/001.jpg`} alt="説明画像02"/>
          </div>
          <p className="text-center"><b>デッキ画像例</b></p>
          
           <h3>2. カードの操作</h3>
          <p>フィールド上のカードは、ドラッグ＆ドロップで好きなゾーンへ移動できます。手札やデッキ、墓地のカードも同様に移動可能です。</p>
          <div className="guide-img">
            <img src={`${process.env.PUBLIC_URL}/images/002.jpg`} alt="説明画像03"/>
          </div>
          
          <h3>3. カードの表示形式</h3>
          <p><span className="indent"></span>フィールド、モンスター、魔法＆罠ゾーンにあるカードは、右クリック（スマホではダブルタップ）でコンテキストメニューを開き、「表示形式を変更」を選択すると、攻撃表示や守備表示、裏側表示などを切り替えられます。</p>
           <div className="guide-img">
            <img src={`${process.env.PUBLIC_URL}/images/003.jpg`} alt="説明画像04"/>
            <img src={`${process.env.PUBLIC_URL}/images/004.jpg`} alt="説明画像05"/>
            <img src={`${process.env.PUBLIC_URL}/images/005.jpg`} alt="説明画像06"/>
          </div>
          
          <h3>4. 墓地</h3>
          <p><span className="indent"></span>墓地のボタンをクリックすると、ポップアップで墓地の中身を確認できます。ポップアップ内のカードも同様に移動可能です。</p>
           <div className="guide-img">
            <img src={`${process.env.PUBLIC_URL}/images/006.jpg`} alt="説明画像07"/>
            <img src={`${process.env.PUBLIC_URL}/images/007.jpg`} alt="説明画像08"/>
          </div>
           <p><span className="indent"></span>右上の「×」ボタンクリックでポップアップは消えます。</p>
          <div className="guide-img guide-img-mini">
            <img src={`${process.env.PUBLIC_URL}/images/009.jpg`} alt="説明画像08"/>
          </div>
          <p><span className="indent"></span>カードは上記矢印の順番で墓地に送られます。</p>

          <h3>5. フリースペース</h3>
          <p><span className="indent"></span>最下部にフリースペースがあります。「デッキの上／下へ戻す」ボタンでスペースに並べた順番で戻すことができます。<br/>
          <span className="indent"></span>カードを好きな順番でデッキに戻す場合などにお使い下さい。
          </p>
          <div className="guide-img">
            <img src={`${process.env.PUBLIC_URL}/images/008.jpg`} alt="説明画像09"/>
          </div>

          <h3>6. 各種機能</h3>
          <p><span className="indent"></span>画面上部のメニューボタンから、リセット（デッキ読み込み直後の状態になります）、操作の巻き戻し（戻る）、サイコロ、コイントスなどの補助機能を利用できます。</p>

           <h3>補足事項</h3>
          <p><span className="indent"></span>ページから離れていてもカード情報を保持する設定をしているため、<b>ページをリロードしてもデッキはリセットされません。</b><br/>
          <span className="indent"></span>新しくデッキを読み込む場合はサイドメニューの「別のデッキを読み込む」からお願いします。
          </p>
        </div>
      </div>
    </div>
  );
};