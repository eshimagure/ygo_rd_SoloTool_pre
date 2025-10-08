import React, { useState } from 'react';
import '../styles/Tabs.css';

// タブのデータ構造を定義
export interface TabItem {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
}

export const Tabs: React.FC<TabsProps> = ({ items }) => {
  // アクティブなタブのインデックスを管理 (初期値は0番目)
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  return (
    <div className="tabs-container">
      {/* タブボタンの一覧 */}
      <div className="tab-list" role="tablist">
        {items.map((item, index) => (
          <button
            key={item.label}
            className={`tab-button ${index === activeTabIndex ? 'tab-button--active' : ''}`}
            onClick={() => setActiveTabIndex(index)}
            role="tab"
            aria-selected={index === activeTabIndex}
            aria-controls={`tab-panel-${index}`}
            id={`tab-${index}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 表示するコンテンツ */}
      <div
        className="tab-panel"
        role="tabpanel"
        id={`tab-panel-${activeTabIndex}`}
        aria-labelledby={`tab-${activeTabIndex}`}
      >
        {items[activeTabIndex].content}
      </div>
    </div>
  );
};