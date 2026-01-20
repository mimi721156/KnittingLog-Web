import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';

// 主題資料
const THEMES = {
  PURPLE: { id: 'PURPLE', name: '薰衣草', primary: '#8e8499', bg: '#f4f2f7', text: '#5d5666', accent: '#dcd3e3' },
  BLUE: { id: 'BLUE', name: '靜謐藍', primary: '#7da1c4', bg: '#f0f5f9', text: '#4e6173', accent: '#cfe0eb' },
  PINK: { id: 'PINK', name: '櫻花粉', primary: '#c48e8e', bg: '#faf3f3', text: '#735252', accent: '#ebcfcf' },
  GREEN: { id: 'GREEN', name: '抹茶森林', primary: '#7B8E6F', bg: '#F2F4EF', text: '#4A5443', accent: '#DDE3D5' },
  SAND: { id: 'SAND', name: '燕麥奶茶', primary: '#A69080', bg: '#F8F6F4', text: '#594E46', accent: '#E6DED8' },
  NIGHT_BLUE: { id: 'NIGHT_BLUE', name: '午夜藍', primary: '#A1B5D1', bg: '#1A1C23', text: '#E2E4E9', accent: '#2D313E' },
  NIGHT_GREEN: { id: 'NIGHT_GREEN', name: '午夜森林', primary: '#8DBA8F', bg: '#161B16', text: '#E0E6E1', accent: '#242B24' },
  NIGHT_PURPLE: { id: 'NIGHT_PURPLE', name: '午夜漿果', primary: '#B2A3D1', bg: '#18151D', text: '#E6E1E9', accent: '#26222C' },
  NIGHT_ROSE: { id: 'NIGHT_ROSE', name: '午夜紅玫瑰', primary: '#D1A1A1', bg: '#1D1515', text: '#E9E1E1', accent: '#2D2222' },
  NIGHT_SLATE: { id: 'NIGHT_SLATE', name: '午夜板岩', primary: '#94A3B8', bg: '#0F172A', text: '#F1F5F9', accent: '#1E293B' },
  NIGHT_GRAY: { id: 'NIGHT_GRAY', name: '午夜極黑', primary: '#9DA5B4', bg: '#121212', text: '#E3E3E3', accent: '#242424' },
  NIGHT_COFFEE: { id: 'NIGHT_COFFEE', name: '午夜可可', primary: '#D4B499', bg: '#1A1816', text: '#ECE5E0', accent: '#292523' },
  DARK: { id: 'DARK', name: '簡約黑', primary: '#1a1a1a', bg: '#ffffff', text: '#1a1a1a', accent: '#eeeeee' },
};

// 棒針 + 勾針 圖示組件
const KnittingIcon = ({ size = 64, color = 'var(--primary-color)' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke={color} fill={color}>
      <line x1="15" y1="15" x2="49" y2="49" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="13" cy="13" r="3" />
      <line x1="49" y1="15" x2="15" y2="49" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="51" cy="13" r="3" />
      <path d="M32 10V50M32 50C32 50 32 54 28 54" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M32 50.5C33.5 49 35 48 37 49" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

const ThemePickerSection = ({ themeKey, setThemeKey, currentTheme }) => {
  const [isExporting, setIsExporting] = useState(false);

  // 導出圖示為 PNG 的功能
  const exportIconAsPng = () => {
    setIsExporting(true);
    const size = 1024; // APP 圖示標準尺寸
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 1. 繪製背景 (使用當前主題的 primary 顏色)
    ctx.fillStyle = currentTheme.primary;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 220); // 圓角矩形，類似 iOS 風格
    ctx.fill();

    // 2. 準備 SVG 字串
    const svgString = `
      <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="${currentTheme.accent}" fill="${currentTheme.accent}">
          <line x1="15" y1="15" x2="49" y2="49" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="13" cy="13" r="3" />
          <line x1="49" y1="15" x2="15" y2="49" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="51" cy="13" r="3" />
          <path d="M32 10V50M32 50C32 50 32 54 28 54" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <path d="M32 50.5C33.5 49 35 48 37 49" stroke-width="2.5" stroke-linecap="round" fill="none" />
        </g>
      </svg>
    `;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // 3. 將 SVG 繪製到 Canvas 中心 (縮放一點留白)
      const padding = 150;
      ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
      
      // 4. 下載 PNG
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `app-icon-${themeKey.toLowerCase()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    };
    img.src = url;
  };

  return (
    <section className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 border border-theme-accent/20 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-theme-primary flex items-center justify-center text-white shadow-lg shadow-theme-primary/20">
            <Icons.Palette size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-theme-text tracking-tight">個人化外觀</h3>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Appearance Settings</p>
          </div>
        </div>

        {/* 導出按鈕 */}
        <button
          onClick={exportIconAsPng}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-theme-text text-theme-bg rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isExporting ? <Icons.Loader className="animate-spin" size={14} /> : <Icons.Download size={14} />}
          Export App Icon
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
        {Object.values(THEMES).map((t) => {
          const isActive = themeKey === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setThemeKey(t.id)}
              className={`
                group relative flex flex-col items-center gap-3 p-3 rounded-[2rem] transition-all duration-300
                ${isActive ? 'bg-white shadow-xl scale-105' : 'hover:bg-white/40'}
              `}
            >
              <div 
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-transform group-hover:rotate-12"
                style={{ 
                  backgroundColor: t.bg,
                  borderColor: isActive ? t.primary : 'rgba(0,0,0,0.05)' 
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full shadow-inner"
                  style={{ backgroundColor: t.primary }}
                />
              </div>
              <span className="text-[10px] font-black tracking-tighter opacity-60 text-center leading-tight" style={{ color: isActive ? t.primary : 'inherit' }}>
                {t.name}
              </span>
              {isActive && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: t.primary }}>
                  <Icons.Check size={10} color="white" strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default function App() {
  const [themeKey, setThemeKey] = useState('PURPLE');
  const currentTheme = THEMES[themeKey] || THEMES.PURPLE;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', currentTheme.primary);
    root.style.setProperty('--bg-color', currentTheme.bg);
    root.style.setProperty('--text-color', currentTheme.text);
    root.style.setProperty('--accent-color', currentTheme.accent);
    root.style.transition = 'background-color 0.6s ease, color 0.6s ease';
  }, [themeKey]);

  return (
    <div className="min-h-screen transition-colors duration-500 font-sans" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex w-24 bg-white border-r border-theme-accent/20 flex-col items-center py-12 space-y-12 shrink-0">
           <div className="w-12 h-12 bg-theme-primary text-white rounded-2xl flex items-center justify-center font-black shadow-lg">C</div>
           <nav className="space-y-8 text-gray-300">
             <Icons.Play size={24} /><Icons.Library size={24} /><Icons.Grid size={24} /><Icons.Info size={24} className="text-theme-primary" />
           </nav>
        </aside>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
          <div className="max-w-4xl mx-auto p-8 md:p-16 space-y-12">
            <header className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-theme-text tracking-tighter">使用指南 & 設定</h2>
              <p className="text-sm font-black opacity-30 uppercase tracking-[0.25em]">Tutorial and Preferences</p>
            </header>

            <ThemePickerSection 
              themeKey={themeKey} 
              setThemeKey={setThemeKey} 
              currentTheme={currentTheme}
            />

            <section className="p-8 rounded-[2.5rem] bg-theme-accent/30 border border-theme-accent/20 flex flex-col md:flex-row items-center gap-8 transition-colors">
               <div className="w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-2xl" style={{ backgroundColor: 'var(--primary-color)' }}>
                  <KnittingIcon size={80} color="var(--accent-color)" />
               </div>
               <div className="flex-1">
                 <h4 className="text-xl font-black mb-2">APP 圖示預覽</h4>
                 <p className="text-sm opacity-70 leading-relaxed mb-4">
                   點擊上方的「Export App Icon」按鈕，系統會將左側這個 iOS 風格的圖示導出為高品質 PNG。你可以將它上傳到線上工具轉換為 .ico 或是直接作為網頁圖示使用。
                 </p>
               </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
