import React, { useState, useRef } from 'react';
import { 
  User, Shield, Smartphone, Bell, AlertTriangle, 
  Upload, Check, RotateCcw, Volume2, HelpCircle, 
  Settings, PenTool, Plus, Trash2, Eye, EyeOff
} from 'lucide-react';
import { PrankState, DocumentData, FineData } from '../types';

interface PrankSettingsPanelProps {
  state: PrankState;
  onChange: (newState: PrankState) => void;
  onTriggerNotification: (message: string) => void;
  onReset: () => void;
}

export default function PrankSettingsPanel({
  state,
  onChange,
  onTriggerNotification,
  onReset
}: PrankSettingsPanelProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'docs' | 'device' | 'fines'>('profile');
  const [customNotificationText, setCustomNotificationText] = useState('Нараховано новий штраф ПДД: 340 ₴ на авто AA1111BP');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'preset'>('preset');
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // File Upload Helper
  const handlePhotoUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const updatedDocs = state.documents.map(doc => {
          if (doc.id === docId) {
            return { ...doc, photoUrl: base64 };
          }
          return doc;
        });
        onChange({
          ...state,
          documents: updatedDocs
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Field edit helpers
  const updateSettingsField = (key: string, value: any) => {
    onChange({
      ...state,
      settings: {
        ...state.settings,
        [key]: value
      }
    });
  };

  const updateProfileField = (key: string, value: any) => {
    const updatedDocs = state.documents.map(doc => {
      return { ...doc, [key]: value };
    });
    onChange({
      ...state,
      documents: updatedDocs
    });
  };

  const updateDocField = (docId: string, key: string, value: any) => {
    const updatedDocs = state.documents.map(doc => {
      if (doc.id === docId) {
        return { ...doc, [key]: value };
      }
      return doc;
    });
    onChange({
      ...state,
      documents: updatedDocs
    });
  };

  // Canvas drawing for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveSignature();
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset back to standard signature
    const updatedDocs = state.documents.map(doc => {
      if (doc.type === 'passport') {
        return { ...doc, signatureData: undefined };
      }
      return doc;
    });
    onChange({ ...state, documents: updatedDocs });
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    
    const updatedDocs = state.documents.map(doc => {
      if (doc.type === 'passport') {
        return { ...doc, signatureData: dataUrl };
      }
      return doc;
    });
    onChange({ ...state, documents: updatedDocs });
  };

  // Fine Management
  const addCustomFine = () => {
    const newFine: FineData = {
      id: Math.random().toString(36).substring(7),
      title: 'Перевищення швидкості (вул. Хрещатик)',
      amount: 340,
      currency: '₴',
      date: new Date().toLocaleDateString('uk-UA'),
      status: 'pending',
      description: 'Перевищення встановлених обмежень швидкості руху транспортних засобів більш як на 20 км/год.',
      vehicleInfo: 'AA 1111 BP (TESLA MODEL Y)',
      articleNumber: 'ч. 1 ст. 122 КУпАП'
    };

    onChange({
      ...state,
      fines: [newFine, ...state.fines]
    });
  };

  const removeFine = (id: string) => {
    onChange({
      ...state,
      fines: state.fines.filter(f => f.id !== id)
    });
  };

  const toggleFineStatus = (id: string) => {
    onChange({
      ...state,
      fines: state.fines.map(f => {
        if (f.id === id) {
          return { ...f, status: f.status === 'pending' ? 'paid' : 'pending' };
        }
        return f;
      })
    });
  };

  const triggerCustomPush = () => {
    if (customNotificationText.trim()) {
      onTriggerNotification(customNotificationText);
    }
  };

  return (
    <div id="prank-dashboard" className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl p-6 h-full flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
              <Shield className="w-6 h-6 animate-pulse" />
              Пранк Панель Дія
            </h2>
            <p className="text-xs text-slate-400">Налаштуйте паспорт друга, штрафи та сповіщення</p>
          </div>
          <button 
            onClick={onReset}
            title="Скинути до початкових"
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Setting Tabs */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl mb-4 text-sm font-medium">
          <button 
            onClick={() => setActiveSettingsTab('profile')}
            className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${activeSettingsTab === 'profile' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ФІО & Фото
          </button>
          <button 
            onClick={() => setActiveSettingsTab('docs')}
            className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${activeSettingsTab === 'docs' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Документи
          </button>
          <button 
            onClick={() => setActiveSettingsTab('device')}
            className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${activeSettingsTab === 'device' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Панель iPhone
          </button>
          <button 
            onClick={() => setActiveSettingsTab('fines')}
            className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${activeSettingsTab === 'fines' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Штрафи
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-4">
          
          {/* TAB 1: Profile & Photo */}
          {activeSettingsTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl space-y-3 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  Дані особи (українською)
                </h3>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Прізвище</label>
                  <input 
                    type="text" 
                    value={state.documents[0]?.lastName || ''} 
                    onChange={(e) => updateProfileField('lastName', e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm uppercase focus:outline-none focus:border-cyan-400"
                    placeholder="САВІНОВ"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ім'я</label>
                  <input 
                    type="text" 
                    value={state.documents[0]?.firstName || ''} 
                    onChange={(e) => updateProfileField('firstName', e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm uppercase focus:outline-none focus:border-cyan-400"
                    placeholder="АРТЕМ"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">По батькові</label>
                  <input 
                    type="text" 
                    value={state.documents[0]?.middleName || ''} 
                    onChange={(e) => updateProfileField('middleName', e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm uppercase focus:outline-none focus:border-cyan-400"
                    placeholder="ВОЛОДИМИРОВИЧ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Дата народження</label>
                    <input 
                      type="text" 
                      value={state.documents[0]?.birthDate || ''} 
                      onChange={(e) => updateProfileField('birthDate', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400"
                      placeholder="05.01.2008"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Вітальне Ім'я</label>
                    <input 
                      type="text" 
                      value={state.settings.profileName} 
                      onChange={(e) => updateSettingsField('profileName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400"
                      placeholder="Олексій"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Завантажити Фото Друга (Пранк!)
                </h3>
                <p className="text-xs text-slate-400">
                  Завантажте портрет вашого друга на світлому фоні. Фото замінить дефолтні на обох документах.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="border border-dashed border-slate-700 p-2 rounded-lg text-center flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-900 transition-all relative overflow-hidden group">
                    <Upload className="w-5 h-5 text-slate-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] text-slate-300 font-medium">Для ID-картки</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload('id-passport', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="border border-dashed border-slate-700 p-2 rounded-lg text-center flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-900 transition-all relative overflow-hidden group">
                    <Upload className="w-5 h-5 text-slate-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] text-slate-300 font-medium">Для Закордонного</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload('foreign-passport', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Documents */}
          {activeSettingsTab === 'docs' && (
            <div className="space-y-4">
              {/* Card 1 Specs */}
              <div className="bg-slate-950 p-4 rounded-xl space-y-3 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Паспорт громадянина України</h3>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">ID-картка</span>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Номер документа</label>
                  <input 
                    type="text" 
                    value={state.documents.find(d => d.id === 'id-passport')?.docNumber || ''} 
                    onChange={(e) => updateDocField('id-passport', 'docNumber', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400"
                    placeholder="011565837"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Стать</label>
                    <input 
                      type="text" 
                      value={state.documents.find(d => d.id === 'id-passport')?.gender || ''} 
                      onChange={(e) => updateDocField('id-passport', 'gender', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400"
                      placeholder="Ч/M"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Громадянство</label>
                    <input 
                      type="text" 
                      value={state.documents.find(d => d.id === 'id-passport')?.citizenship || ''} 
                      onChange={(e) => updateDocField('id-passport', 'citizenship', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400"
                      placeholder="УКРАЇНА/UKR"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2 Specs */}
              <div className="bg-slate-950 p-4 rounded-xl space-y-3 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Закордонний паспорт</h3>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Міжнародний</span>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Номер документа</label>
                  <input 
                    type="text" 
                    value={state.documents.find(d => d.id === 'foreign-passport')?.docNumber || ''} 
                    onChange={(e) => updateDocField('foreign-passport', 'docNumber', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400"
                    placeholder="GK671238"
                  />
                </div>
              </div>

              {/* Interactive Signature Canvas */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                    Електронний підпис
                  </h3>
                  <div className="flex gap-1 text-[10px]">
                    <button 
                      onClick={() => setSignatureMode('preset')}
                      className={`px-2 py-0.5 rounded ${signatureMode === 'preset' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      Пресет
                    </button>
                    <button 
                      onClick={() => setSignatureMode('draw')}
                      className={`px-2 py-0.5 rounded ${signatureMode === 'draw' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      Намалювати
                    </button>
                  </div>
                </div>

                {signatureMode === 'draw' ? (
                  <div className="space-y-2">
                    <canvas
                      id="signature-canvas"
                      ref={signatureCanvasRef}
                      width={300}
                      height={100}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full bg-white rounded-lg border border-slate-700 cursor-crosshair touch-none"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Намалюйте підпис пальцем/мишкою</span>
                      <button 
                        onClick={clearSignature}
                        className="text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                      >
                        Очистити
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Використовується фірмовий каліграфічний підпис "Сав". Переключіть режим, щоб намалювати власний унікальний підпис.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Device Controls */}
          {activeSettingsTab === 'device' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl space-y-3 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  Параметри Симулятора iPhone
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Годинник зверху</label>
                    <input 
                      type="text" 
                      value={state.settings.currentTimeOverride} 
                      onChange={(e) => updateSettingsField('currentTimeOverride', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-cyan-400"
                      placeholder="20:22"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Заряд батареї (%)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      value={state.settings.batteryLevel} 
                      onChange={(e) => updateSettingsField('batteryLevel', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-cyan-400"
                      placeholder="73"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Рівень сигналу (1-4)</label>
                    <select 
                      value={state.settings.signalStrength} 
                      onChange={(e) => updateSettingsField('signalStrength', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="4">4 - Відмінний</option>
                      <option value="3">3 - Хороший</option>
                      <option value="2">2 - Слабкий</option>
                      <option value="1">1 - Дуже слабкий</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Вбудовані ефекти</label>
                    <div className="flex gap-2 pt-1 text-xs">
                      <button 
                        onClick={() => updateSettingsField('hapticEnabled', !state.settings.hapticEnabled)}
                        className={`px-2.5 py-1 rounded cursor-pointer ${state.settings.hapticEnabled ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        Haptic {state.settings.hapticEnabled ? 'ON' : 'OFF'}
                      </button>
                      <button 
                        onClick={() => updateSettingsField('soundEnabled', !state.settings.soundEnabled)}
                        className={`px-2.5 py-1 rounded cursor-pointer ${state.settings.soundEnabled ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        Звуки {state.settings.soundEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={state.settings.isFaceIDEnabled} 
                      onChange={(e) => updateSettingsField('isFaceIDEnabled', e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                    />
                    Увімкнути FaceID при вході в додаток
                  </label>
                </div>
              </div>

              {/* Trigger Notification */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-cyan-400 animate-bounce" />
                  Надіслати фейковий Пуш (Prank!)
                </h3>
                <p className="text-xs text-slate-400">
                  Натисніть кнопку, щоб на екрані з'явився офіційний банер сповіщення iOS від "Дія"
                </p>
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    value={customNotificationText} 
                    onChange={(e) => setCustomNotificationText(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="Введіть текст сповіщення..."
                  />
                  <button 
                    onClick={triggerCustomPush}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-lg active:scale-95"
                  >
                    Пуш!
                  </button>
                </div>
                <div className="flex gap-1.5 pt-1 overflow-x-auto text-[10px]">
                  <button 
                    onClick={() => setCustomNotificationText('Увага! Призовнику САВІНОВ А. В. негайно з\'явитися до ТЦК для уточнення даних.')}
                    className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded hover:bg-slate-800 hover:text-white shrink-0 cursor-pointer"
                  >
                    Повістка ТЦК
                  </button>
                  <button 
                    onClick={() => setCustomNotificationText('Штраф сплачено успішно! Дякуємо, що користуєтесь Дією.')}
                    className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded hover:bg-slate-800 hover:text-white shrink-0 cursor-pointer"
                  >
                    Сплата штрафу
                  </button>
                  <button 
                    onClick={() => setCustomNotificationText('Новий штраф ПДД: Перевищення швидкості на суму 340 ₴')}
                    className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded hover:bg-slate-800 hover:text-white shrink-0 cursor-pointer"
                  >
                    Штраф 340 ₴
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Fines & Services */}
          {activeSettingsTab === 'fines' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                    Керування Штрафами
                  </h3>
                  <button 
                    onClick={addCustomFine}
                    className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Додати штраф
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {state.fines.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 italic">Штрафів не знайдено. Додайте один, щоб протестувати оплату!</p>
                  ) : (
                    state.fines.map((fine) => (
                      <div key={fine.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs flex justify-between items-start gap-2 hover:border-slate-700 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-200">
                            <span>{fine.amount} {fine.currency}</span>
                            <span className={`text-[9px] px-1 rounded uppercase ${fine.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                              {fine.status === 'pending' ? 'Очікує' : 'Сплачено'}
                            </span>
                          </div>
                          <p className="text-slate-400 line-clamp-1 mt-0.5">{fine.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{fine.date} • {fine.vehicleInfo}</p>
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => toggleFineStatus(fine.id)}
                            title="Змінити статус"
                            className="p-1 hover:bg-slate-800 rounded text-cyan-400 hover:text-white transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => removeFine(fine.id)}
                            title="Видалити"
                            className="p-1 hover:bg-slate-800 rounded text-red-400 hover:text-red-300 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-xs text-cyan-200 space-y-1">
                <span className="font-bold flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Корисна порада для розіграшу:</span>
                <p>
                  Встановіть ім'я друга, завантажте його фото і надішліть пуш-повідомлення. Після цього покажіть йому екран "Документи" або "Сервіси" — реакція буде незабутньою! 
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
        <span>Diia Simulator v1.0 • Пранк додаток</span>
        <span className="text-slate-400 font-bold">Створено для розваг</span>
      </div>
    </div>
  );
}
