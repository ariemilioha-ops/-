import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Smartphone, Bell, Flame, User, Search, 
  Car, Shield, FileCheck, Check, ArrowLeft, Send, 
  AlertCircle, ChevronRight, MessageSquare, HelpCircle,
  Menu, Info, Eye, EyeOff, Settings, Volume2, Sparkles
} from 'lucide-react';
import { PrankState, DocumentData, FineData, PrankSettings } from './types';
import DocumentCard from './components/DocumentCard';
import PrankSettingsPanel from './components/PrankSettingsPanel';

// Default generated boy photos from image generation
const BOY_ID_PHOTO = '/src/assets/images/boy_id_card_photo_1783277096885.jpg';
const BOY_PASSPORT_PHOTO = '/src/assets/images/boy_passport_photo_1783277110619.jpg';

const INITIAL_STATE: PrankState = {
  documents: [
    {
      id: 'id-passport',
      type: 'passport',
      title: 'Паспорт громадянина\nУкраїни',
      photoUrl: BOY_ID_PHOTO,
      lastName: 'САВІНОВ',
      firstName: 'АРТЕМ',
      middleName: 'ВОЛОДИМИРОВИЧ',
      birthDate: '05.01.2008',
      docNumber: '011565837',
      expiryDate: '05.07.2036',
      citizenship: 'УКРАЇНА/UKR',
      gender: 'Ч/M'
    },
    {
      id: 'foreign-passport',
      type: 'custom',
      title: 'Закордонний\nпаспорт',
      photoUrl: BOY_PASSPORT_PHOTO,
      lastName: 'САВІНОВ',
      firstName: 'АРТЕМ',
      middleName: 'ВОЛОДИМИРОВИЧ',
      birthDate: '05.01.2008',
      docNumber: 'GK671238',
      expiryDate: '05.07.2031',
      citizenship: 'УКРАЇНА/UKR',
      gender: 'Ч/M'
    },
    {
      id: 'tax-id',
      type: 'custom',
      title: 'Картка платника\nподатків',
      photoUrl: '',
      lastName: 'САВІНОВ',
      firstName: 'АРТЕМ',
      middleName: 'ВОЛОДИМИРОВИЧ',
      birthDate: '05.01.2008',
      docNumber: '4054715236',
      expiryDate: '',
      citizenship: '',
      gender: ''
    }
  ],
  fines: [
    {
      id: 'fine-tesla',
      title: 'Перевищення швидкості (вул. Хрещатик)',
      amount: 340,
      currency: '₴',
      date: '05.07.2026',
      status: 'pending',
      description: 'Перевищення встановлених обмежень швидкості руху транспортних засобів більш як на 20 км/год.',
      vehicleInfo: 'AA 1111 BP (TESLA MODEL Y)',
      articleNumber: 'ч. 1 ст. 122 КУпАП'
    }
  ],
  settings: {
    profileName: 'Артем',
    isFaceIDEnabled: true,
    hapticEnabled: true,
    soundEnabled: true,
    activeTab: 'documents',
    selectedDocId: 'id-passport',
    currentTimeOverride: '',
    batteryLevel: 73,
    signalStrength: 4,
    showSimulatedPhoneOnly: false
  }
};

export default function App() {
  const [state, setState] = useState<PrankState>(() => {
    const saved = localStorage.getItem('diia_prank_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure image links are correct
        if (parsed.documents && parsed.documents[0] && parsed.documents[0].photoUrl === '') {
          parsed.documents[0].photoUrl = BOY_ID_PHOTO;
        }
        if (parsed.documents && parsed.documents[1] && parsed.documents[1].photoUrl === '') {
          parsed.documents[1].photoUrl = BOY_PASSPORT_PHOTO;
        }
        // Force birth date to 05.01.2008 on state restore
        if (parsed.documents) {
          parsed.documents = parsed.documents.map((doc: any) => ({
            ...doc,
            birthDate: '05.01.2008'
          }));
          
          // Make sure Tax ID exists in parsed documents
          if (!parsed.documents.find((d: any) => d.id === 'tax-id')) {
            parsed.documents.push({
              id: 'tax-id',
              type: 'custom',
              title: 'Картка платника\nподатків',
              photoUrl: '',
              lastName: parsed.documents[0]?.lastName || 'САВІНОВ',
              firstName: parsed.documents[0]?.firstName || 'АРТЕМ',
              middleName: parsed.documents[0]?.middleName || 'ВОЛОДИМИРОВИЧ',
              birthDate: '05.01.2008',
              docNumber: '4054715236',
              expiryDate: '',
              citizenship: '',
              gender: ''
            });
          }
        }
        return parsed;
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  // App core variables
  const [activeTab, setActiveTab] = useState<'documents' | 'services' | 'notifications' | 'menu'>('documents');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showFaceID, setShowFaceID] = useState(false);
  const [faceIDSuccess, setFaceIDSuccess] = useState(false);
  const [showPrankSettings, setShowPrankSettings] = useState(true);
  const [activeFineDetail, setActiveFineDetail] = useState<FineData | null>(null);

  // Live Kharkiv Clock State
  const [kharkivTime, setKharkivTime] = useState('');

  useEffect(() => {
    const getKharkivTime = () => {
      try {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Europe/Kyiv',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        };
        return new Intl.DateTimeFormat('uk-UA', options).format(new Date());
      } catch (e) {
        const d = new Date();
        const hrs = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${hrs}:${mins}`;
      }
    };

    setKharkivTime(getKharkivTime());
    const interval = setInterval(() => {
      setKharkivTime(getKharkivTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Apple Pay simulation state
  const [payingFine, setPayingFine] = useState<FineData | null>(null);
  const [applePayStep, setApplePayStep] = useState<'idle' | 'sheet' | 'processing' | 'success'>('idle');

  // Active push notification
  const [pushNotification, setPushNotification] = useState<string | null>(null);
  const [showPushBanner, setShowPushBanner] = useState(false);

  // Swipe / Drag gesture tracking for real-time card sliding
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const swipeStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.targetTouches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - swipeStartX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (swipeStartX.current === null) return;
    setIsDragging(false);
    const threshold = 60; // swipe threshold
    if (dragOffset < -threshold) {
      if (activeCardIndex < state.documents.length - 1) {
        playHaptic();
        setActiveCardIndex(prev => prev + 1);
      }
    } else if (dragOffset > threshold) {
      if (activeCardIndex > 0) {
        playHaptic();
        setActiveCardIndex(prev => prev - 1);
      }
    }
    setDragOffset(0);
    swipeStartX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    swipeStartX.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (swipeStartX.current === null) return;
    const currentX = e.clientX;
    const diff = currentX - swipeStartX.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (swipeStartX.current === null) return;
    setIsDragging(false);
    const threshold = 60;
    if (dragOffset < -threshold) {
      if (activeCardIndex < state.documents.length - 1) {
        playHaptic();
        setActiveCardIndex(prev => prev + 1);
      }
    } else if (dragOffset > threshold) {
      if (activeCardIndex > 0) {
        playHaptic();
        setActiveCardIndex(prev => prev - 1);
      }
    }
    setDragOffset(0);
    swipeStartX.current = null;
  };

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<{ sender: 'ai' | 'user'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: 'Привіт, Артеме! 🌟 Я твій інтелектуальний асистент Дія.AI. Допомагаю перевірити документи, знайти послуги чи дізнатися статус штрафів. Про що хочеш запитати?',
      time: '20:22'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('diia_prank_state', JSON.stringify(state));
  }, [state]);

  // Handle FaceID popup on load
  useEffect(() => {
    if (state.settings.isFaceIDEnabled) {
      setShowFaceID(true);
      const timer = setTimeout(() => {
        setFaceIDSuccess(true);
        playHaptic();
        playSuccessSound();
        const fadeTimer = setTimeout(() => {
          setShowFaceID(false);
          setFaceIDSuccess(false);
        }, 1200);
        return () => clearTimeout(fadeTimer);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Haptic Feedback player
  const playHaptic = () => {
    if (!state.settings.hapticEnabled) return;
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }
  };

  const playDoubleHaptic = () => {
    if (!state.settings.hapticEnabled) return;
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([15, 40, 15]);
    }
  };

  // Sound effects
  const playSuccessSound = () => {
    if (!state.settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc2.start();
      osc.stop(audioCtx.currentTime + 0.45);
      osc2.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.log('Audio Blocked', e);
    }
  };

  const playNotificationSound = () => {
    if (!state.settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.2); // E6

      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log(e);
    }
  };

  // Trigger simulated push notification
  const triggerNotification = (message: string) => {
    playNotificationSound();
    playDoubleHaptic();
    setPushNotification(message);
    setShowPushBanner(true);
    
    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      setShowPushBanner(false);
    }, 6000);
    return () => clearTimeout(timer);
  };

  // Reset helper
  const handleReset = () => {
    setState(INITIAL_STATE);
    setActiveTab('documents');
    setActiveCardIndex(0);
    localStorage.removeItem('diia_prank_state');
  };

  // AI Chat Bot Answer Generator
  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    playHaptic();
    const userMsg = chatInput.trim();
    const newMessages = [...chatMessages, { sender: 'user' as const, text: userMsg, time: state.settings.currentTimeOverride }];
    setChatMessages(newMessages);
    setChatInput('');
    setAiTyping(true);

    // AI thinking transition
    setTimeout(() => {
      let aiResponseText = '';
      const textLower = userMsg.toLowerCase();

      if (textLower.includes('штраф') || textLower.includes('оплат')) {
        const pendingCount = state.fines.filter(f => f.status === 'pending').length;
        if (pendingCount > 0) {
          aiResponseText = `Артеме, за нашими даними у вас зареєстровано ${pendingCount} неоплачений штраф на суму 340 ₴ за перевищення швидкості на Tesla Y. Пропоную сплатити його безпосередньо в розділі Сервіси, щоб уникнути арешту майна! 🚗`;
        } else {
          aiResponseText = `Чудова новина, Артеме! Всі ваші штрафи повністю сплачено. Ви — зразковий водій! 🎉`;
        }
      } else if (textLower.includes('повістк') || textLower.includes('призов') || textLower.includes('тцк')) {
        aiResponseText = `⚠️ УВАГА! Оновлено статус військовозобов'язаного для САВІНОВ А. В. Повістка про необхідність уточнення облікових даних надіслана за місцем реєстрації. Будь ласка, з'явіться до ТЦК протягом 3-х робочих днів. (Це розіграш!)`;
      } else if (textLower.includes('паспорт') || textLower.includes('документ')) {
        aiResponseText = `У вашому кабінеті Дії доступно 2 цифрові документи: 1) Паспорт громадянина України (ID-картка №011565837), та 2) Закордонний паспорт (серія GK671238). Обидва документи мають повну юридичну силу та оновлені о 15:45.`;
      } else if (textLower.includes('хто ти') || textLower.includes('асистент')) {
        aiResponseText = `Я — офіційний інтелектуальний ШІ-асистент Дія.AI. Я допомагаю Артему та його друзям розігрувати один одного за допомогою неймовірно реалістичних копій державних документів! 😉`;
      } else if (textLower.includes('артем') || textLower.includes('савінов')) {
        aiResponseText = `Савінов Артем Володимирович народився 05.01.2011. За нашими даними, він є чудовим другом і дуже веселим хлопцем, якого ви щойно вирішили розіграти за допомогою цієї копії Дії!`;
      } else if (textLower.includes('привіт') || textLower.includes('здравствуй') || textLower.includes('привет')) {
        aiResponseText = `Привіт, Артеме! Радий чути тебе. Чим я, розумний асистент Дія.AI, можу допомогти тобі з твоїми документами чи послугами сьогодні?`;
      } else {
        aiResponseText = `Дякую за запит, Артеме! Я обробив ваше повідомлення "${userMsg}" за допомогою алгоритмів Дія.AI. Послуга зараз знаходиться на стадії бета-тестування. Якщо це частина розіграшу вашого друга — ви робите все просто супер! 😂`;
      }

      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        time: state.settings.currentTimeOverride
      }]);
      setAiTyping(false);
      playSuccessSound();
    }, 1500);
  };

  // Apple Pay simulation handler
  const triggerApplePay = (fine: FineData) => {
    setPayingFine(fine);
    setApplePayStep('sheet');
    playHaptic();
  };

  const confirmApplePay = () => {
    setApplePayStep('processing');
    playDoubleHaptic();
    
    setTimeout(() => {
      setApplePayStep('success');
      playSuccessSound();
      playDoubleHaptic();
      
      // Update state
      const updatedFines = state.fines.map(f => {
        if (f.id === payingFine?.id) {
          return { ...f, status: 'paid' as const };
        }
        return f;
      });
      setState({
        ...state,
        fines: updatedFines
      });

      // Update active detailed fine status
      if (activeFineDetail?.id === payingFine?.id) {
        setActiveFineDetail({
          ...activeFineDetail,
          status: 'paid'
        });
      }

      setTimeout(() => {
        setApplePayStep('idle');
        setPayingFine(null);
        triggerNotification('Штраф успішно сплачено! Платіжний ордер надіслано на email.');
      }, 1500);

    }, 2000);
  };

  // Header quick triple-tap to open Prank settings
  let clickCount = 0;
  let lastClickTime = 0;
  const handleStatusBarClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 400) {
      clickCount++;
      if (clickCount >= 3) {
        setShowPrankSettings(!showPrankSettings);
        playDoubleHaptic();
        clickCount = 0;
      }
    } else {
      clickCount = 1;
    }
    lastClickTime = now;
  };

  // Active Background color gradient matching document index
  const getAppBackgroundClass = () => {
    if (activeTab === 'documents') {
      return 'animate-flow-bg';
    }
    return 'from-black via-zinc-950 to-zinc-900 bg-black';
  };

  return (
    <div id="diia-app-container" className="min-h-screen bg-[#0b0f19] text-white font-sans flex flex-col md:flex-row items-center justify-center p-0 md:p-6 gap-6 relative overflow-x-hidden">
      
      {/* ==================== LEFT PANEL: WEB PREVIEW PRANK CONTROLLER ==================== */}
      {showPrankSettings && (
        <div id="settings-panel-wrapper" className="w-full md:w-[420px] h-[95vh] shrink-0 z-30 order-2 md:order-1 px-4 md:px-0">
          <PrankSettingsPanel
            state={state}
            onChange={setState}
            onTriggerNotification={triggerNotification}
            onReset={handleReset}
          />
        </div>
      )}

      {/* Mini Toggle Button on top right of the viewport */}
      <button 
        onClick={() => {
          setShowPrankSettings(!showPrankSettings);
          playHaptic();
        }}
        id="toggle-panel-btn"
        className="fixed top-4 right-4 z-40 bg-slate-900 border border-slate-800 text-white p-3 rounded-full shadow-2xl hover:bg-slate-800 active:scale-95 cursor-pointer transition-all flex items-center gap-2 text-xs font-semibold"
      >
        <Settings className="w-5 h-5 animate-spin-slow" />
        <span>{showPrankSettings ? 'Сховати Пранк-Панель' : 'Відкрити Пранк-Панель'}</span>
      </button>

      {/* ==================== INTERACTIVE SLEEK VIEWPORT ==================== */}
      <div 
        id="iphone-wrapper"
        className="relative mx-auto my-auto w-full max-w-[390px] h-[844px] bg-black rounded-[44px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden shrink-0 order-1 md:order-2 flex flex-col justify-between border border-slate-900"
      >
        {/* Dynamic iOS Status Bar */}
        <div 
          onClick={handleStatusBarClick}
          id="iphone-status-bar"
          className={`absolute top-0 inset-x-0 h-11 px-6 flex justify-between items-center z-40 select-none cursor-pointer text-xs font-bold transition-colors ${activeTab === 'documents' ? 'text-slate-900/95' : 'text-slate-200'}`}
        >
          {/* Real Time / Custom Override on Left */}
          <span className="font-sans font-extrabold tracking-tight pt-1.5 text-[13px]">
            {state.settings.currentTimeOverride || kharkivTime}
          </span>

          {/* Cellular, Wifi and Battery on Right */}
          <div className="flex items-center gap-1.5 pt-1.5">
            {/* Signal Strength bars */}
            <div className="flex items-end gap-[2px] h-3 w-5">
              {[1, 2, 3, 4].map((bar) => (
                <div 
                  key={bar} 
                  className={`w-[3px] rounded-sm transition-all ${
                    bar <= state.settings.signalStrength 
                      ? (activeTab === 'documents' ? 'bg-slate-900' : 'bg-slate-100') 
                      : (activeTab === 'documents' ? 'bg-slate-900/20' : 'bg-slate-100/20')
                  }`}
                  style={{ height: `${bar * 25}%` }}
                />
              ))}
            </div>

            <span className="text-[10px] tracking-tighter uppercase font-extrabold">5G</span>

            {/* WiFi icon */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5c3.5-3 10.5-3 14 0M8.5 16c2-1.5 5-1.5 7 0M11.5 19.5a1 1 0 101 0" />
            </svg>

            {/* Battery Replica with Overlaid Percentage (iOS style) */}
            <div className="relative flex items-center">
              <div className={`relative w-6 h-3.5 rounded-[4px] p-[1.5px] border flex items-center ${activeTab === 'documents' ? 'border-slate-900' : 'border-slate-100/80'}`}>
                <div 
                  className={`h-full rounded-[2px] ${state.settings.batteryLevel < 20 ? 'bg-rose-500' : (activeTab === 'documents' ? 'bg-slate-900' : 'bg-slate-100')}`}
                  style={{ width: `${state.settings.batteryLevel}%` }}
                />
                {/* Overlaid Battery Text */}
                <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-sans font-black tracking-tighter leading-none text-center mix-blend-difference text-white">
                  {state.settings.batteryLevel}
                </span>
              </div>
              <div className={`w-[1.5px] h-1.5 rounded-r-[1px] ${activeTab === 'documents' ? 'bg-slate-900' : 'bg-slate-100'}`} />
            </div>
          </div>
        </div>

        {/* ==================== SLIDED DOWN PUSH NOTIFICATION BANNER ==================== */}
        {showPushBanner && pushNotification && (
          <div 
            onClick={() => {
              setActiveTab('services');
              if (pushNotification.includes('штраф') || pushNotification.includes('340')) {
                setActiveFineDetail(state.fines[0]);
              }
              setShowPushBanner(false);
            }}
            id="ios-push-banner"
            className="absolute top-12 inset-x-3 bg-zinc-950/95 text-slate-100 p-3.5 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.5)] border border-slate-800/80 z-50 flex gap-3 cursor-pointer select-none active:scale-98 transition-transform duration-200 animate-slide-down backdrop-blur-xl"
          >
            <style>{`
              @keyframes slideDown {
                0% { transform: translateY(-110%); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
              }
              .animate-slide-down {
                animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>
            
            {/* Diia Mini Icon */}
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[#a1eed0] shrink-0 shadow">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M12 4L8 8M12 4L16 8M8 8V12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12V8M12 16V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="flex-1 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black tracking-wider uppercase text-cyan-400">Дія</span>
                <span className="text-[10px] text-slate-500 font-medium">зараз</span>
              </div>
              <p className="text-xs font-bold text-slate-200 mt-0.5 leading-snug">
                {pushNotification}
              </p>
              <span className="text-[10px] text-slate-500 block mt-1 font-semibold">Натисніть для перегляду деталей</span>
            </div>
          </div>
        )}

        {/* ==================== AUTH FACE ID OVERLAY SCREEN ==================== */}
        {showFaceID && (
          <div id="face-id-overlay" className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="space-y-8 animate-fade-in">
              <style>{`
                @keyframes pulseGlow {
                  0%, 100% { transform: scale(1); opacity: 0.8; }
                  50% { transform: scale(1.05); opacity: 1; }
                }
                .animate-pulse-glow {
                  animation: pulseGlow 2s infinite ease-in-out;
                }
              `}</style>

              {/* Glowing FaceID scan border */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                {/* Simulated Laser Radar Ring */}
                <div className={`absolute inset-0 rounded-[38px] border-2 transition-all duration-700 ${faceIDSuccess ? 'border-green-400 scale-105' : 'border-cyan-500/40 animate-pulse'}`} />
                <div className={`absolute inset-2 rounded-[30px] border border-dashed transition-all duration-700 ${faceIDSuccess ? 'border-green-400' : 'border-cyan-500/20'}`} />
                
                {/* Face ID Graphic SVG */}
                <svg 
                  viewBox="0 0 100 100" 
                  className={`w-20 h-20 transition-all duration-500 ${faceIDSuccess ? 'text-green-400' : 'text-cyan-400 animate-pulse-glow'}`}
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  {/* Face outline corner lines */}
                  <path d="M25 35V25H35M65 25H75V35M75 65V75H65M35 75H25V65" strokeWidth="3.5" strokeLinecap="round" />
                  {/* Eyes and Nose */}
                  <path d="M38 48a2 2 0 100-4 2 2 0 000 4zm24 0a2 2 0 100-4 2 2 0 000 4z" fill="currentColor" />
                  <path d="M50 42v15h8" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Smile */}
                  <path d="M40 68q10 8 20 0" strokeLinecap="round" />
                </svg>

                {/* Laser scan line overlay */}
                {!faceIDSuccess && (
                  <div className="absolute inset-x-4 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce" />
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-100">
                  {faceIDSuccess ? 'Успішно авторизовано' : 'Авторизація через FaceID'}
                </h2>
                <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                  {faceIDSuccess ? 'Вітаємо в Дії' : 'Будь ласка, подивіться в камеру для входу в систему'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MAIN CONTENT AREA ==================== */}
        <div 
          id="iphone-app-body"
          className={`flex-1 flex flex-col pt-11 overflow-hidden transition-all duration-500 bg-gradient-to-b ${getAppBackgroundClass()}`}
        >
          
          {/* ==================== SCREEN 1: DOCUMENTS ==================== */}
          {activeTab === 'documents' && (
            <div id="screen-documents" className="flex-1 flex flex-col justify-between py-5 overflow-hidden">
              
              {/* Pagination indicators Header - REMOVED per user request */}

              {/* Main horizontally draggable Document Cards Carousel with smooth slide and transparent peeking columns */}
              <div 
                className="flex-1 flex items-center justify-start overflow-hidden relative select-none cursor-grab active:cursor-grabbing py-2"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Slidable strip of cards */}
                <div 
                  className={`absolute left-1/2 flex gap-3 items-center ${isDragging ? 'transition-none' : 'transition-transform duration-500 ease-out'}`}
                  style={{
                    transform: `translateX(calc(-156px - ${activeCardIndex * 324}px + ${dragOffset}px))`
                  }}
                >
                  {state.documents.map((doc, idx) => {
                    const isCurrent = idx === activeCardIndex;
                    return (
                      <div 
                        key={doc.id}
                        className={`transition-all duration-500 ease-out shrink-0 transform ${
                          isCurrent 
                            ? 'opacity-100 scale-100 z-10' 
                            : 'opacity-30 scale-[0.93]'
                        }`}
                        style={{
                          width: '312px',
                        }}
                      >
                        <DocumentCard
                          document={doc}
                          isHapticEnabled={state.settings.hapticEnabled}
                          isSoundEnabled={state.settings.soundEnabled}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Carousel Pagination Dots matching Photo exactly */}
              <div className="flex justify-center gap-[6px] py-4 select-none z-10">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (idx < state.documents.length) {
                        playHaptic();
                        setActiveCardIndex(idx);
                      }
                    }}
                    className={`w-[7px] h-[7px] rounded-full ${
                      idx === activeCardIndex 
                        ? 'bg-white' 
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>

            </div>
          )}

          {/* ==================== SCREEN 2: SERVICES ==================== */}
          {activeTab === 'services' && (
            <div id="screen-services" className="flex-1 flex flex-col text-slate-100 overflow-y-auto px-5 pt-4">
              {activeFineDetail ? (
                /* Detail sub-screen */
                <div className="space-y-6 flex-1 flex flex-col justify-between py-2 text-left">
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        playHaptic();
                        setActiveFineDetail(null);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Назад до послуг
                    </button>

                    <div className="flex justify-between items-center pt-2">
                      <h2 className="text-xl font-black">Сплата Штрафу ПДД</h2>
                      <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${activeFineDetail.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                        {activeFineDetail.status === 'pending' ? 'Очікує оплати' : 'Сплачено'}
                      </span>
                    </div>

                    {/* Central Sum display */}
                    <div className="bg-zinc-900/50 rounded-2xl p-6 text-center border border-zinc-800/80">
                      <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Сума до сплати</span>
                      <span className="text-4xl font-black tracking-tight mt-1 text-white block">
                        {activeFineDetail.amount} {activeFineDetail.currency}
                      </span>
                    </div>

                    {/* Fine description card */}
                    <div className="space-y-3.5 bg-zinc-950 p-4.5 rounded-2xl border border-zinc-900/80 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[9px]">Автомобіль</span>
                        <span className="text-slate-200 block font-bold text-sm mt-0.5">{activeFineDetail.vehicleInfo}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[9px]">Постанова</span>
                        <span className="text-slate-200 block font-bold mt-0.5">{activeFineDetail.articleNumber} від {activeFineDetail.date}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[9px]">Опис порушення</span>
                        <span className="text-slate-300 block leading-relaxed mt-1">{activeFineDetail.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <div className="pt-4 pb-2">
                    {activeFineDetail.status === 'pending' ? (
                      <button
                        onClick={() => triggerApplePay(activeFineDetail)}
                        className="w-full bg-white hover:bg-slate-200 text-black py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                      >
                        Оплатити через Apple Pay
                      </button>
                    ) : (
                      <div className="w-full bg-green-500/10 border border-green-500/20 text-green-400 py-4 rounded-2xl font-bold text-sm text-center flex items-center justify-center gap-1.5">
                        <Check className="w-5 h-5" /> Штраф повністю сплачено!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Main services grid */
                <div className="space-y-5 text-left flex-1 flex flex-col">
                  <div>
                    <h2 className="text-2xl font-black text-white">Послуги</h2>
                    <p className="text-xs text-slate-400">Швидкі державні послуги у вашому смартфоні</p>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Пошук послуг" 
                      className="w-full bg-zinc-900 border border-zinc-800/80 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold placeholder-slate-500"
                    />
                  </div>

                  {/* Grid of tiles */}
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    
                    {/* Item 1: Fines */}
                    <div 
                      onClick={() => {
                        playHaptic();
                        setActiveFineDetail(state.fines[0]);
                      }}
                      className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl cursor-pointer transition-all active:scale-95 text-left flex flex-col justify-between h-[110px] relative overflow-hidden group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow border border-amber-500/20">
                        <Car className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-slate-200">Штрафи ПДД</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Керування авто</span>
                      </div>

                      {/* Pending fine count indicator */}
                      {state.fines.filter(f => f.status === 'pending').length > 0 && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-amber-500 text-black rounded-full flex items-center justify-center text-[10px] font-black animate-pulse shadow">
                          {state.fines.filter(f => f.status === 'pending').length}
                        </div>
                      )}
                    </div>

                    {/* Item 2: Taxes */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl cursor-not-allowed opacity-80 text-left flex flex-col justify-between h-[110px]">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-slate-200 font-sans">Податки ФОП</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Немає боргу</span>
                      </div>
                    </div>

                    {/* Item 3: Certificates */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl cursor-not-allowed opacity-80 text-left flex flex-col justify-between h-[110px]">
                      <div className="w-10 h-10 rounded-xl bg-[#00c57d]/10 flex items-center justify-center text-[#00c57d] border border-[#00c57d]/20">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-slate-200">Довідки</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Отримати виписку</span>
                      </div>
                    </div>

                    {/* Item 4: Military Document */}
                    <div 
                      onClick={() => {
                        playHaptic();
                        triggerNotification('⚠️ Увага! Документ "Військовий квиток" недоступний. Дані уточнюються в реєстрі Оберіг.');
                      }}
                      className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl cursor-pointer transition-all active:scale-95 text-left flex flex-col justify-between h-[110px] relative overflow-hidden group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                        <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-slate-200">Військовий квит.</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Реєстр Оберіг</span>
                      </div>
                    </div>

                  </div>

                  {/* Beta services banner */}
                  <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-900 flex gap-3.5 items-center mt-auto">
                    <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Дія.Радар & ЄОселя</span>
                      <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">Скористайтеся новими послугами фінансування та шерингу автівок у Дії.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== SCREEN 3: DIIA.AI CHATBOT ==================== */}
          {activeTab === 'notifications' && (
            <div id="screen-chat" className="flex-1 flex flex-col text-slate-200 h-full overflow-hidden">
              {/* Chat Header */}
              <div className="p-3 bg-zinc-950 border-b border-zinc-900 text-left flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 shadow border border-cyan-500/20">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                    Дія.AI Асистент
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </h2>
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Розумний державний ШІ</p>
                </div>
              </div>

              {/* Chat messages list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col text-left">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-normal flex flex-col ${
                      msg.sender === 'user' 
                        ? 'bg-cyan-600 text-white self-end rounded-tr-none' 
                        : 'bg-zinc-900/90 text-slate-100 self-start rounded-tl-none border border-zinc-800/60'
                    }`}
                  >
                    <span>{msg.text}</span>
                    <span className={`text-[9px] block mt-1 text-right font-medium opacity-65`}>
                      {msg.time}
                    </span>
                  </div>
                ))}

                {/* Typing status indicator */}
                {aiTyping && (
                  <div className="bg-zinc-900 text-slate-400 self-start rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-1.5 border border-zinc-800/80">
                    <span className="text-[10px] font-bold">Дія.AI думає</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                )}
              </div>

              {/* Quick suggestions panels */}
              {chatMessages.length < 3 && (
                <div className="p-3 bg-zinc-950/50 border-t border-zinc-900 flex gap-2 overflow-x-auto select-none">
                  {[
                    'Перевірити мої штрафи',
                    'Чи прийшла повістка?',
                    'Хто ти такий?'
                  ].map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setChatInput(sugg);
                        // Trigger sending on next render frame or programmatically
                        setTimeout(() => {
                          playHaptic();
                        }, 50);
                      }}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-slate-300 rounded-xl text-[10px] font-semibold shrink-0 cursor-pointer hover:bg-zinc-800 hover:text-white"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input panel */}
              <form 
                onSubmit={handleSendChatMessage}
                className="p-3 bg-zinc-950 border-t border-zinc-900 flex gap-2 items-center"
              >
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Запитайте Дія.AI українською..." 
                  className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-xl px-3.5 py-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-semibold"
                />
                <button 
                  type="submit"
                  className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ==================== SCREEN 4: MENU / FEED ==================== */}
          {activeTab === 'menu' && (
            <div id="screen-menu" className="flex-1 flex flex-col text-slate-200 overflow-y-auto px-5 pt-4 text-left space-y-5">
              
              {/* Profile Card Header */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-700/50 bg-slate-800">
                  <img src={state.documents[0].photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase">{state.documents[0].lastName} {state.documents[0].firstName}</h2>
                  <span className="text-[10px] bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Громадянин</span>
                </div>
              </div>

              {/* Grid of menu options */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Кабінет громадянина</span>
                
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/80 divide-y divide-zinc-900 overflow-hidden text-xs">
                  <div 
                    onClick={() => {
                      playHaptic();
                      setShowPrankSettings(true);
                    }}
                    className="p-4 flex justify-between items-center hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <span className="font-bold flex items-center gap-2 text-cyan-400">
                      <Settings className="w-4 h-4" /> 🔧 Налаштування пранку (Пранк-Панель)
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Prank Disclaimer Card */}
              <div className="p-4 bg-[#111] border border-zinc-900 rounded-2xl space-y-2">
                <div className="flex items-center gap-1 text-xs font-black text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Дія-Розіграш (Simulator)
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Цей додаток є інтерактивним макетом, створеним виключно для жартів над друзями та знайомими. Він не збирає, не зберігає і не передає ніяких персональних даних до державних органів та немає жодного зв'язку з Міністерством цифрової трансформації України.
                </p>
              </div>

              {/* Version */}
              <div className="text-center text-[10px] text-slate-600 font-semibold pt-4 pb-2">
                Дія Simulator v1.0.4 • Ліцензія Пранку
              </div>

            </div>
          )}

        </div>

        {/* ==================== SEMI-TRANSPARENT BLUR TAB BAR (GLASSMORPHISM) ==================== */}
        <div 
          id="iphone-tab-bar"
          className="h-[84px] border-t border-slate-800/10 bg-black/85 backdrop-blur-md flex items-start justify-between px-3 pt-2.5 text-[10px] font-bold tracking-tight select-none z-30"
        >
          {/* Tab 1: Стрічка */}
          <button 
            onClick={() => {
              playHaptic();
              setActiveTab('menu');
            }}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'menu' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {/* True stacked double card outline as seen in photo */}
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2" />
              <rect x="3" y="9" width="12" height="12" rx="2.5" />
              <line x1="6" y1="13" x2="12" y2="13" />
              <line x1="6" y1="16" x2="10" y2="16" />
            </svg>
            <span>Стрічка</span>
          </button>

          {/* Tab 2: Документи (Active Selected on load) */}
          <button 
            onClick={() => {
              playHaptic();
              setActiveTab('documents');
            }}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'documents' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {/* Real Diia ID Document Icon with photo outline inside and text rows exactly like photo */}
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="3.5" />
              <rect x="7" y="7" width="4" height="5" rx="1" />
              <path d="M6 16c0-1.5 1-2.5 2.5-2.5h1c1 0 1.5.5 1.5 1" />
              <line x1="14" y1="8" x2="17" y2="8" />
              <line x1="14" y1="11" x2="17" y2="11" />
              <line x1="14" y1="14" x2="17" y2="14" />
            </svg>
            <span>Документи</span>
          </button>

          {/* Tab 3: Дія.AI */}
          <button 
            onClick={() => {
              playHaptic();
              setActiveTab('notifications');
            }}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'notifications' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {/* Real Diia.AI Trident-circle inside rounded square exactly like photo */}
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5.5" />
              <circle cx="12" cy="12" r="5" />
              <path d="M12 9v6M10 10.5v2a2 2 0 0 0 4 0v-2" strokeWidth="1.8" />
            </svg>
            <span>Дія.AI</span>
          </button>

          {/* Tab 4: Сервіси */}
          <button 
            onClick={() => {
              playHaptic();
              setActiveTab('services');
            }}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'services' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {/* Real Diia Lightning Bolt in Rounded Square Icon exactly like photo */}
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="4.5" />
              <path d="M13 7.5l-3.5 4.5h3l-1 4.5 3.5-4.5h-3l1-4.5z" fill="currentColor" className="text-current" />
            </svg>
            <span>Сервіси</span>
          </button>

          {/* Tab 5: Меню */}
          <button 
            onClick={() => {
              playHaptic();
              setActiveTab('menu');
            }}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'menu' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {/* User Profile in Circle with red badge exactly like photo */}
            <div className="relative">
              <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8.5" />
                <circle cx="12" cy="10.5" r="2.5" />
                <path d="M7 17.5c1-2.5 2.8-4 5-4s4 1.5 5 4" />
              </svg>
              {/* Fake red notification dot matching photo */}
              <span className="absolute -top-[1.5px] -right-[1.5px] w-[7px] h-[7px] bg-[#ff3b30] rounded-full border border-black shadow-sm animate-pulse" />
            </div>
            <span>Меню</span>
          </button>
        </div>

        {/* iPhone bottom swipe indicator bar */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/70 rounded-full z-40 pointer-events-none" />

      </div>

      {/* ==================== APPLE PAY SLIDE-SHEET SIMULATOR OVERLAY ==================== */}
      {applePayStep !== 'idle' && payingFine && (
        <div id="apple-pay-overlay" className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center select-none backdrop-blur-[2px]">
          <div className="w-full max-w-[390px] bg-neutral-900 rounded-t-[40px] border-t border-neutral-800 p-6 space-y-6 text-left animate-slide-up shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
            <style>{`
              @keyframes slideUp {
                0% { transform: translateY(100%); }
                100% { transform: translateY(0); }
              }
              .animate-slide-up {
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>

            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto" />

            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-1.5 font-sans">
                <span className="font-extrabold text-lg text-white"> Pay</span>
              </div>
              <button 
                onClick={() => setApplePayStep('idle')}
                className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Скасувати
              </button>
            </div>

            {applePayStep === 'sheet' && (
              <div className="space-y-6">
                {/* Simulated credit card list */}
                <div className="flex gap-4 items-center bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                  <div className="w-12 h-8 rounded bg-gradient-to-r from-indigo-500 to-purple-600 border border-indigo-400/20 shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-100 block">Monobank Mastercard</span>
                    <span className="text-[10px] text-slate-500 block">Карта •••• 1234 • Артем Савінов</span>
                  </div>
                </div>

                {/* Fine item details summary */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Штраф ПДД (Дія)</span>
                  <span className="font-bold text-slate-200">{payingFine.amount} {payingFine.currency}</span>
                </div>

                <div className="flex justify-between items-center border-t border-neutral-800 pt-4 text-sm font-bold">
                  <span className="text-slate-400">Всього до сплати</span>
                  <span className="text-white text-lg font-black">{payingFine.amount} {payingFine.currency}</span>
                </div>

                {/* Action instructions */}
                <button
                  onClick={confirmApplePay}
                  className="w-full bg-white hover:bg-slate-200 text-black py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-lg"
                >
                  Підтвердити оплату з Pay
                </button>
                <p className="text-[10px] text-slate-500 text-center font-medium">Двічі натисніть для підтвердження оплати біометрією</p>
              </div>
            )}

            {applePayStep === 'processing' && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300 block">Обробка транзакції...</span>
                  <p className="text-[10px] text-slate-500">Запит авторизації у банку-еквайєрі</p>
                </div>
              </div>
            )}

            {applePayStep === 'success' && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center shadow-lg">
                  <Check className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-black text-white block">Сплачено успішно!</span>
                  <p className="text-[10px] text-slate-500">Кошти успішно надіслано до Держбюджету</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
