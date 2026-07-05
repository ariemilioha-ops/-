import React, { useState, useEffect, useRef } from 'react';
import { DocumentData } from '../types';

interface DocumentCardProps {
  document: DocumentData;
  isHapticEnabled: boolean;
  isSoundEnabled: boolean;
}

export default function DocumentCard({
  document,
  isHapticEnabled,
  isSoundEnabled
}: DocumentCardProps) {
  const [rotateY, setRotateY] = useState(0);
  const isFlipped = (rotateY / 180) % 2 !== 0;
  const [timerCount, setTimerCount] = useState(177); // Default exactly at 2:57 countdown!
  const [backViewMode, setBackViewMode] = useState<'qr' | 'barcode'>('qr');
  const [qrOffset, setQrOffset] = useState(0);
  const [gyroPos, setGyroPos] = useState({ x: 50, y: 50 });
  const [updateTimeStr, setUpdateTimeStr] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setUpdateTimeStr(`${day}.${month}.${year} • Документ оновлено о ${hours}:${minutes}`);
  }, []);

  const marqueeText = updateTimeStr 
    ? `${updateTimeStr} • ${updateTimeStr} • ${updateTimeStr} • `
    : '05.07.2026 • Документ оновлено • ';

  // Audio effect for flipping & clicks - disabled per user request to never play sound on flip
  const playFlipSound = () => {
    // Completely silent
  };

  // Trigger feedback
  const triggerFeedback = () => {
    if (isHapticEnabled && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(12); // Short pleasant vibration
    }
  };

  const handleCardClick = () => {
    triggerFeedback();
    setRotateY(prev => prev + 180);
  };

  // Dynamic QR countdown and simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerCount(prev => {
        if (prev <= 1) {
          // Trigger slight random offset to simulate QR pattern changing
          setQrOffset(Math.floor(Math.random() * 100));
          return 180;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mouse move hologram effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGyroPos({ x, y });
  };

  // Mobile Device Orientation Gyroscope Effect
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta && e.gamma) {
        // Map beta (-180 to 180) and gamma (-90 to 90) to 0-100 values
        const x = Math.min(Math.max(((e.gamma + 30) / 60) * 100, 0), 100);
        const y = Math.min(Math.max(((e.beta - 20) / 60) * 100, 0), 100);
        setGyroPos({ x, y });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Generate a procedural, realistic QR Code Grid pattern based on qrOffset
  const renderQRCodeGrid = () => {
    const cells = [];
    const size = 25; // 25x25 QR grid
    
    // Simple deterministic pseudo-random generator
    const seedRandom = (i: number) => {
      const x = Math.sin(i + qrOffset) * 10000;
      return x - Math.floor(x);
    };

    // Helper to check if coords fall inside finder patterns (top-left, top-right, bottom-left)
    const isFinder = (r: number, c: number) => {
      if (r < 7 && c < 7) return true; // top-left
      if (r < 7 && c >= size - 7) return true; // top-right
      if (r >= size - 7 && c < 7) return true; // bottom-left
      return false;
    };

    // Helper to check if coords are inside the centered logo (7x7 area)
    const isCenterLogo = (r: number, c: number) => {
      const min = Math.floor(size / 2) - 3;
      const max = Math.floor(size / 2) + 3;
      return r >= min && r <= max && c >= min && c <= max;
    };

    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        if (isFinder(r, c)) {
          // Draw standard QR finder pattern logic
          // Outer border
          const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6 ||
                                (r === 0 && c >= size - 7) || (r === 6 && c >= size - 7) ||
                                (c === size - 1 && r < 7) || (c === size - 7 && r < 7) ||
                                (r === size - 1 && c < 7) || (r === size - 7 && c < 7) ||
                                (c === 0 && r >= size - 7) || (c === 6 && r >= size - 7);
          
          const isInnerSquare = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
                                (r >= 2 && r <= 4 && c >= size - 5 && c <= size - 3) ||
                                (r >= size - 5 && r <= size - 3 && c >= 2 && c <= 4);
          
          row.push(isOuterBorder || isInnerSquare);
        } else if (isCenterLogo(r, c)) {
          row.push(false); // Empty space for Diia logo overlay
        } else {
          // Standard random QR noise
          const val = seedRandom(r * size + c) > 0.45;
          row.push(val);
        }
      }
      cells.push(row);
    }

    return (
      <div id="qr-grid-box" className="grid grid-cols-25 gap-[1px] bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm relative w-full aspect-square">
        {cells.map((row, r) => 
          row.map((active, c) => (
            <div 
              key={`${r}-${c}`} 
              className={`w-full h-full transition-all duration-300 ${active ? 'bg-black' : 'bg-transparent'}`} 
            />
          ))
        )}

        {/* Floating Diia/Ukrainian Trident Logo in center */}
        <div className="absolute top-[38%] left-[38%] w-[24%] h-[24%] bg-black text-white rounded-xl flex items-center justify-center p-1.5 border-4 border-white shadow-md">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20M12 4L8 8M12 4L16 8M8 8V12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12V8M12 16V20" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );
  };

  // Generate a deterministic high-fidelity SVG barcode
  const renderBarcode = () => {
    return (
      <div id="barcode-display-container" className="flex flex-col items-center justify-center space-y-2.5 w-full px-2">
        <div className="flex h-20 w-full justify-between items-stretch select-none">
          {[2, 4, 1, 3, 5, 2, 4, 3, 1, 3, 1, 5, 3, 2, 4, 3, 1, 5, 2, 3, 1, 4, 5, 2, 3, 2, 5, 3, 1, 4].map((width, idx) => (
            <div 
              key={idx} 
              className={`flex-1 ${idx % 2 === 0 ? 'bg-black' : 'bg-transparent'}`} 
              style={{ flexGrow: width }} 
            />
          ))}
        </div>
        <span className="text-xs font-bold font-mono tracking-[4px] text-slate-900 uppercase pt-1 select-none">
          {document.type === 'passport' ? 'ID' : 'GK'}-{document.docNumber}
        </span>
      </div>
    );
  };

  // Card specific backgrounds and properties
  const isIdPassport = document.type === 'passport';
  const isTaxId = document.id === 'tax-id';

  // Specific custom gradients
  const getCardBackground = () => {
    if (isTaxId) {
      return 'linear-gradient(135deg, rgba(223, 215, 243, 0.5) 0%, rgba(245, 231, 219, 0.45) 50%, rgba(215, 223, 243, 0.4) 100%)';
    }
    if (isIdPassport) {
      return 'linear-gradient(135deg, rgba(203, 229, 246, 0.45) 0%, rgba(223, 237, 248, 0.35) 100%)';
    }
    // Foreign passport
    return 'linear-gradient(135deg, rgba(98, 176, 185, 0.45) 0%, rgba(70, 155, 164, 0.35) 60%, rgba(171, 140, 185, 0.3) 100%)';
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="perspective-1000 w-[312px] h-[456px] select-none cursor-pointer group active:scale-[0.99] transition-transform duration-200 ease-out"
      style={{ WebkitTapHighlightColor: 'transparent' }}
      id={`doc-card-${document.id}`}
    >
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 16s linear infinite;
        }
        .grid-cols-25 {
          grid-template-columns: repeat(25, minmax(0, 1fr));
        }
      `}</style>

      {/* Card Rotator */}
      <div 
        onClick={handleCardClick}
        className="w-full h-full relative transition-transform duration-500 transform-style-3d"
        style={{
          transform: `rotateY(${rotateY}deg)`
        }}
        id={`card-rotator-${document.id}`}
      >
        
        {/* ==================== CARD FRONT ==================== */}
        <div 
          className="absolute inset-0 rounded-[32px] pt-6 px-6 pb-4 flex flex-col justify-between overflow-hidden shadow-xl border border-white/25 backface-hidden select-none backdrop-blur-xl"
          style={{
            background: getCardBackground(),
            color: '#000000'
          }}
          id={`card-front-${document.id}`}
        >
          {/* Hologram Overlay shifting on mouse/tilt */}
          <div 
            className="absolute inset-0 pointer-events-none z-10 opacity-35 mix-blend-color-dodge transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${gyroPos.x}% ${gyroPos.y}%, rgba(255,255,255,0.8) 0%, rgba(255,0,128,0.2) 20%, rgba(0,255,255,0.2) 55%, transparent 100%)`,
            }}
          />

          {/* ================== CONDITIONAL LAYOUTS: TAX ID VS PASSPORTS ================== */}
          {isTaxId ? (
            /* ==================== TAX ID FRONT (РНОКПП) ==================== */
            <>
              <div className="flex flex-col justify-start flex-1 text-left">
                {/* TOP SECTION: Title */}
                <div className="flex flex-col z-10 text-left pt-1">
                  <h2 className="text-[19px] font-bold tracking-tight leading-[1.2] whitespace-pre-line text-black font-sans">
                    {document.title}
                  </h2>
                  <span className="text-[11px] font-semibold text-black/80 uppercase tracking-widest mt-0.5">РНОКПП</span>
                </div>

                {/* MIDDLE SECTION: Name & Fields */}
                <div className="flex flex-col justify-start space-y-3 z-10 text-left py-1 text-black mt-2 ml-[-12px]">
                  <div className="flex flex-col text-black">
                    <h1 className="text-[19px] font-semibold uppercase tracking-tight leading-[1.15] font-sans">
                      {document.lastName}
                    </h1>
                    <h2 className="text-[19px] font-semibold uppercase tracking-tight leading-[1.15] font-sans">
                      {document.firstName}
                    </h2>
                    <h3 className="text-[19px] font-semibold uppercase tracking-tight leading-[1.15] font-sans text-black/90">
                      {document.middleName}
                    </h3>
                  </div>
                  <div>
                    <span className="text-[12px] text-black font-normal block leading-[1.2] font-sans">
                      Дата
                      <br />
                      народження:
                    </span>
                    <span className="text-[12px] font-normal block mt-1 text-black leading-none font-sans">{document.birthDate}</span>
                  </div>
                </div>
              </div>

              {/* ENDLESS SCROLLING GREEN TAPE */}
              <div className="relative h-6 bg-gradient-to-r from-[#98e2c6] to-[#7fcdff] -mx-6 overflow-hidden flex items-center border-y border-[#abdeb8]/20 z-10 mt-6 mb-1 shrink-0">
                <div className="flex whitespace-nowrap animate-marquee font-sans">
                  <span className="shrink-0 text-[10.5px] font-bold text-[#054421] px-2 tracking-tight">
                    {marqueeText}
                  </span>
                  <span className="shrink-0 text-[10.5px] font-bold text-[#054421] px-2 tracking-tight">
                    {marqueeText}
                  </span>
                </div>
              </div>

              {/* BOTTOM SECTION: Big Tax Number & ellipsis */}
              <div className="flex justify-between items-center z-10 mt-1 pb-1 shrink-0">
                <div className="flex items-center gap-2 text-black">
                  <span className="text-[21px] font-black tracking-normal font-sans">
                    {document.docNumber}
                  </span>
                  {/* Copy vector icon exactly like photo */}
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-black cursor-pointer active:scale-90 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </div>

                {/* Action Ellipsis circle - SMALLER, BLACK, SPACED DOTS */}
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-md active:scale-95 transition-transform shrink-0">
                  <div className="flex gap-[3.5px]">
                    <span className="w-[3.5px] h-[3.5px] bg-white rounded-full" />
                    <span className="w-[3.5px] h-[3.5px] bg-white rounded-full" />
                    <span className="w-[3.5px] h-[3.5px] bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ==================== PASSPORT FRONT (ID & FOREIGN) ==================== */
            <>
              <div className="flex flex-col justify-start flex-1 text-left">
                {/* TOP SECTION: Document Title */}
                <div className="flex justify-between items-start z-10 pt-1">
                  <h2 className="text-[17px] font-bold tracking-tight leading-[1.2] whitespace-pre-line text-black font-display text-left">
                    {document.title}
                  </h2>
                </div>

                {/* MIDDLE SECTION: Photo & Details */}
                <div className="flex gap-4 items-start mt-3.5 z-10">
                  {/* Passport Photo (No weird emblems) */}
                  <div className="relative shrink-0">
                    <div className="w-[114px] h-[150px] bg-white rounded-2xl overflow-hidden border border-[#b4c4d4] shadow-md">
                      <img 
                        src={document.photoUrl} 
                        alt="Passport Portrait" 
                        className="w-full h-full object-cover select-none pointer-events-none"
                        draggable="false"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Core Fields */}
                  <div className="flex-1 flex flex-col justify-start gap-3 h-[150px] py-0.5 text-black text-left">
                    <div>
                      <span className="text-[12px] text-black font-normal block leading-[1.2] font-sans">
                        Дата
                        <br />
                        народження:
                      </span>
                      <span className="text-[12px] font-normal block mt-1 text-black leading-none font-sans">{document.birthDate}</span>
                    </div>

                    <div>
                      <span className="text-[12px] text-black font-normal block leading-[1.2] font-sans">Номер:</span>
                      <span className="text-[12px] font-normal block mt-1 tracking-wide text-black leading-none font-sans">{document.docNumber}</span>
                    </div>

                    {/* Handwritten Signature */}
                    <div className="pt-1 select-none text-left">
                      {document.signatureData ? (
                        <img 
                          src={document.signatureData} 
                          alt="Signature" 
                          className="h-10 object-contain mix-blend-multiply opacity-85 select-none pointer-events-none"
                          draggable="false"
                        />
                      ) : (
                        /* Stylized signature monogram exactly like photo ('С' + squiggle + line) */
                        <svg viewBox="0 0 120 50" className="h-11 w-28 text-[#0a1f35] opacity-90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M 20,32 C 15,25 18,15 28,12 C 38,9 43,22 35,28 C 30,32 23,28 25,22 C 27,15 38,18 42,25" />
                          <path d="M 42,25 C 45,20 48,18 52,22 C 55,26 52,32 48,29 C 45,26 49,15 56,18 L 62,30" />
                          <path d="M 58,26 L 75,12" />
                          <path d="M 54,16 C 62,18 70,16 78,14" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ENDLESS SCROLLING GREEN TAPE (shimmering gradient, positioned lower) */}
              <div className="relative h-6 bg-gradient-to-r from-[#98e2c6] to-[#7fcdff] -mx-6 overflow-hidden flex items-center border-y border-[#abdeb8]/20 z-10 mt-6 mb-1 shrink-0">
                <div className="flex whitespace-nowrap animate-marquee font-sans">
                  <span className="shrink-0 text-[10.5px] font-bold text-[#054421] px-2 tracking-tight">
                    {marqueeText}
                  </span>
                  <span className="shrink-0 text-[10.5px] font-bold text-[#054421] px-2 tracking-tight">
                    {marqueeText}
                  </span>
                </div>
              </div>

              {/* BOTTOM SECTION: Name & Menu Button */}
              <div className="flex justify-between items-end z-10 mt-1 pb-1 shrink-0">
                <div className="flex flex-col text-black text-left ml-[-12px]">
                  <h1 className="text-[19px] font-semibold uppercase tracking-tight leading-[1.1] font-sans">
                    {document.lastName}
                  </h1>
                  <h2 className="text-[19px] font-semibold uppercase tracking-tight leading-[1.1] font-sans">
                    {document.firstName}
                  </h2>
                  <h3 className="text-[19px] font-semibold uppercase tracking-tight leading-[1.1] font-sans text-black/90">
                    {document.middleName}
                  </h3>
                </div>

                {/* Action Ellipsis circle - SMALLER, BLACK, SPACED DOTS */}
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-md active:scale-95 transition-transform shrink-0">
                  <div className="flex gap-[3.5px]">
                    <span className="w-[3.5px] h-[3.5px] bg-white rounded-full" />
                    <span className="w-[3.5px] h-[3.5px] bg-white rounded-full" />
                    <span className="w-[3.5px] h-[3.5px] bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* ==================== CARD BACK (QR CODE & BARCODE SELECTORS) ==================== */}
        <div 
          className="absolute inset-0 rounded-[32px] p-6 flex flex-col justify-between items-center overflow-hidden shadow-xl bg-white text-[#0f2a4a] border border-white/60 rotate-y-180 backface-hidden select-none"
          id={`card-back-${document.id}`}
        >
          {/* TOP Countdown block inside card - NO extra stripes/indicators */}
          <div className="w-full text-center pt-1.5 z-10">
            <span className="text-[13px] font-semibold text-slate-500/90 font-sans block leading-normal select-none">
              Код діятиме ще {Math.floor(timerCount / 60)}:{String(timerCount % 60).padStart(2, '0')} хв
            </span>
          </div>

          {/* Core Interactive Graphic (QR-код или Штрихкод) */}
          <div className="w-[185px] h-[185px] flex items-center justify-center relative my-auto z-10">
            {backViewMode === 'qr' ? (
              renderQRCodeGrid()
            ) : (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-inner flex flex-col items-center justify-center w-full aspect-square">
                {renderBarcode()}
              </div>
            )}
          </div>

          {/* TWO toggle buttons exactly like photo at bottom of the card back */}
          <div className="w-full flex justify-center gap-10 pb-3 z-10 select-none">
            
            {/* QR-код Selector Button */}
            <div className="flex flex-col items-center gap-1">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFeedback();
                  setBackViewMode('qr');
                }}
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all shadow-sm ${
                  backViewMode === 'qr' 
                    ? 'bg-black text-white scale-105' 
                    : 'bg-[#e2e8f0]/85 text-slate-600 hover:bg-[#cbd5e1]'
                }`}
              >
                {/* Clean miniature QR logo with locator squares inside */}
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="currentColor">
                  <rect x="4" y="4" width="6" height="6" rx="1.2" />
                  <rect x="6" y="6" width="2" height="2" fill={backViewMode === 'qr' ? 'black' : 'white'} />
                  
                  <rect x="14" y="4" width="6" height="6" rx="1.2" />
                  <rect x="16" y="6" width="2" height="2" fill={backViewMode === 'qr' ? 'black' : 'white'} />
                  
                  <rect x="4" y="14" width="6" height="6" rx="1.2" />
                  <rect x="6" y="16" width="2" height="2" fill={backViewMode === 'qr' ? 'black' : 'white'} />
                  
                  <rect x="14" y="14" width="2" height="2" />
                  <rect x="18" y="14" width="2" height="2" />
                  <rect x="14" y="18" width="2" height="2" />
                  <rect x="18" y="18" width="2" height="2" />
                </svg>
              </button>
              <span className={`text-[11px] font-bold tracking-tight ${backViewMode === 'qr' ? 'text-black font-extrabold' : 'text-slate-400'}`}>
                QR-код
              </span>
            </div>

            {/* Штрихкод Selector Button */}
            <div className="flex flex-col items-center gap-1">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFeedback();
                  setBackViewMode('barcode');
                }}
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all shadow-sm ${
                  backViewMode === 'barcode' 
                    ? 'bg-black text-white scale-105' 
                    : 'bg-[#e2e8f0]/85 text-slate-600 hover:bg-[#cbd5e1]'
                }`}
              >
                {/* 5 clean vertical strokes of varying widths exactly like barcode icon in photo */}
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <line x1="5" y1="5" x2="5" y2="19" />
                  <line x1="9" y1="5" x2="9" y2="19" strokeWidth="1.6" />
                  <line x1="12" y1="5" x2="12" y2="19" strokeWidth="3.6" />
                  <line x1="16" y1="5" x2="16" y2="19" strokeWidth="1.6" />
                  <line x1="19" y1="5" x2="19" y2="19" strokeWidth="2.6" />
                </svg>
              </button>
              <span className={`text-[11px] font-bold tracking-tight ${backViewMode === 'barcode' ? 'text-black font-extrabold' : 'text-slate-400'}`}>
                Штрихкод
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
