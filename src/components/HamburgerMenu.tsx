import React, { useState } from 'react';
import '../styles/HamburgerMenu.css';
// メニュー項目の型を定義
interface MenuItem {
  label: string;
  onClick: () => void;
  isLink?: boolean; // 外部リンクなどかどうかの判定用
}

interface HamburgerMenuProps {
  items: MenuItem[];
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`menu-container ${isOpen ? 'menu--open' : ''}`}>
      {/* ハンバーガーボタン */}
      <button
        className="Menu-button"
        onClick={toggleMenu}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={isOpen}
      >
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* ナビゲーションメニュー */}
      <nav className="menu-nav">
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              <button onClick={() => {
                item.onClick();
                setIsOpen(false); // 項目をクリックしたらメニューを閉じる
              }}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* メニューが開いている時の背景オーバーレイ */}
      {isOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}
    </div>
  );
};