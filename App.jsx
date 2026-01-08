import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shirt, 
  Plus, 
  LayoutGrid, 
  CloudRain, 
  Sun, 
  Trash2, 
  Check, 
  X, 
  Calendar,
  Thermometer,
  Umbrella,
  Heart,
  Sparkles,
  Loader2,
  MessageCircleHeart,
  Snowflake,
  Wind,
  SunMedium,
  Droplets,
  ArrowUp,
  ArrowDown,
  MapPin,
  Pencil,
  Clock,
  Filter,
  AlertCircle,
  Camera,
  ChevronLeft,
  Palette,
  RotateCcw,
  ThumbsUp,
  Star,
  Globe,
  ChevronDown,
  RefreshCcw
} from 'lucide-react';

// --- Gemini API Configuration ---
const apiKey = "AIzaSyC5wd-TKNDjMZqEo27tCmpiLB1wnWTK9Nc"; // API key will be injected by the environment automatically

// --- Constants & Helpers ---
const LOCATIONS = [
  { country: "台灣", name: "台北市", minTemp: 22, maxTemp: 26, rainProb: 60 },
  { country: "台灣", name: "台中市", minTemp: 24, maxTemp: 30, rainProb: 10 },
  { country: "台灣", name: "高雄市", minTemp: 26, maxTemp: 32, rainProb: 5 },
  { country: "日本", name: "東京", minTemp: 15, maxTemp: 20, rainProb: 30 },
  { country: "韓國", name: "首爾", minTemp: 10, maxTemp: 18, rainProb: 0 },
];

const SEASONS = [
  { id: 'summer', label: '夏', desc: '> 25°C', icon: SunMedium, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { id: 'spring_autumn', label: '春/秋', desc: '20-25°C', icon: Wind, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  { id: 'winter', label: '冬', desc: '< 20°C', icon: Snowflake, color: 'bg-blue-100 text-blue-600 border-blue-200' },
];

const SEASON_CONFIG = {
  summer: { months: [5, 6, 7, 8], minTemp: 26 },
  spring_autumn: { months: [3, 4, 9, 10], minTemp: 20, maxTemp: 25 },
  winter: { months: [11, 0, 1, 2], maxTemp: 19 }
};

const COLORS = [
  { id: 'red', hex: "#ef4444", label: "紅" },
  { id: 'orange', hex: "#f97316", label: "橙" },
  { id: 'yellow', hex: "#eab308", label: "黃" },
  { id: 'green', hex: "#22c55e", label: "綠" },
  { id: 'blue', hex: "#3b82f6", label: "藍" },
  { id: 'purple', hex: "#a855f7", label: "紫" },
  { id: 'pink', hex: "#ec4899", label: "粉" },
  { id: 'brown', hex: "#78350f", label: "棕" },
  { id: 'white', hex: "#ffffff", label: "白" },
  { id: 'gray', hex: "#6b7280", label: "灰" },
  { id: 'black', hex: "#000000", label: "黑" },
];

const INITIAL_OUTFITS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80",
    seasons: ['winter', 'spring_autumn'],
    isNotRainFriendly: true, 
    colors: ['pink', 'white'], 
    lastWorn: new Date().toISOString(),
    highlight: "溫柔粉色針織衫搭簡約下身，展現甜美氣質，約會首選！💕"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&q=80",
    seasons: ['spring_autumn', 'summer'],
    isNotRainFriendly: false,
    colors: ['white', 'gray'],
    lastWorn: new Date().toISOString(),
    highlight: "清爽俐落的淺色套裝，上班休閒兩相宜，展現知性美感✨"
  }
];

// Helper to strip markdown code blocks from JSON string
const cleanJsonString = (str) => {
  if (!str) return "{}";
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'manage' | 'create'
  const [lastView, setLastView] = useState('home'); 
  const [outfits, setOutfits] = useState(INITIAL_OUTFITS);
  
  // Weather State
  const [locationIndex, setLocationIndex] = useState(0);
  const weather = LOCATIONS[locationIndex];
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const [selectedOutfitId, setSelectedOutfitId] = useState(null);
  const [viewState, setViewState] = useState('browsing'); // 'browsing' | 'result'
  
  // Filter States
  const [homeFilterColor, setHomeFilterColor] = useState(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [manageFilterColor, setManageFilterColor] = useState(null);
  const [manageFilterSeason, setManageFilterSeason] = useState(null);
  const [manageFilterRainFriendly, setManageFilterRainFriendly] = useState(false);

  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);

  // AI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null); 
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  
  // Form State
  const [newOutfit, setNewOutfit] = useState({
    id: null, 
    image: "",
    seasons: [], 
    isNotRainFriendly: false, 
    colors: [],
    highlight: ""
  });
  const [isFormDirty, setIsFormDirty] = useState(false);

  // --- CORE FUNCTIONS ---

  const toggleSeason = (seasonId) => {
    setNewOutfit(prev => {
      const exists = prev.seasons && prev.seasons.includes(seasonId);
      if (exists) return { ...prev, seasons: prev.seasons.filter(s => s !== seasonId) };
      else return { ...prev, seasons: [...(prev.seasons || []), seasonId] };
    });
    setIsFormDirty(true);
  };

  const toggleColor = (colorId) => {
    setNewOutfit(prev => {
        const exists = prev.colors && prev.colors.includes(colorId);
        if (exists) return { ...prev, colors: prev.colors.filter(c => c !== colorId) };
        else return { ...prev, colors: [...(prev.colors || []), colorId] };
    });
    setIsFormDirty(true);
  };

  const updateNewOutfit = (updates) => {
      setNewOutfit(prev => ({ ...prev, ...updates }));
      setIsFormDirty(true);
  };

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('ootd_outfits');
    if (saved) {
      try {
        setOutfits(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved outfits", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('ootd_outfits', JSON.stringify(outfits));
  }, [outfits]);

  // Smart Default for Create Mode
  useEffect(() => {
    // When entering create mode
    if (view === 'create' && (!newOutfit.seasons || newOutfit.seasons.length === 0) && !newOutfit.id) {
      const currentMonth = new Date().getMonth(); 
      let suggestedSeason = '';
      if (SEASON_CONFIG.summer.months.includes(currentMonth)) suggestedSeason = 'summer';
      else if (SEASON_CONFIG.spring_autumn.months.includes(currentMonth)) suggestedSeason = 'spring_autumn';
      else suggestedSeason = 'winter';
      if (suggestedSeason) {
          setNewOutfit(prev => ({ ...prev, seasons: [suggestedSeason] }));
      }
    }
  }, [view, newOutfit.id]);

  // Navigation Guard
  const switchTab = (targetTab) => {
      if (view === 'create' && isFormDirty) {
          if (!window.confirm("尚未儲存，切換頁面將會遺失目前編輯的內容，確定要離開嗎？")) return;
      }
      
      // If leaving home, reset home state
      if (view === 'home' && targetTab !== 'home') {
        setViewState('browsing');
        setSelectedOutfitId(null);
        setAiFeedback(null);
      }
      
      // If entering create mode from scratch (via tab bar), reset form
      if (targetTab === 'create' && view !== 'create') {
           setLastView(view);
           setNewOutfit({ id: null, image: "", seasons: [], isNotRainFriendly: false, colors: [], highlight: "" });
           setIsFormDirty(false);
      }

      setView(targetTab);
  };

  const handleCancelCreate = () => {
      if (isFormDirty) {
          if (!window.confirm("尚未儲存，確定要取消嗎？")) return;
      }
      setView(lastView || 'home');
      setIsFormDirty(false);
  };

  // --- Recommendations Logic ---
  const { homeRecommendations, availableColors } = useMemo(() => {
    const avgTemp = (weather.minTemp + weather.maxTemp) / 2;
    const currentMonth = new Date().getMonth();
    const targetSeasons = new Set();
    
    if (avgTemp > 25) targetSeasons.add('summer');
    else if (avgTemp >= 20) targetSeasons.add('spring_autumn');
    else targetSeasons.add('winter');

    if (SEASON_CONFIG.summer.months.includes(currentMonth)) targetSeasons.add('summer');
    else if (SEASON_CONFIG.spring_autumn.months.includes(currentMonth)) targetSeasons.add('spring_autumn');
    else targetSeasons.add('winter');

    let base = outfits.filter(o => {
      const seasonMatch = o.seasons && o.seasons.some(s => targetSeasons.has(s));
      let rainMatch = true;
      // Auto rain filter logic (smart recommendation)
      if (weather.rainProb > 50) {
        rainMatch = !o.isNotRainFriendly;
      }
      return seasonMatch && rainMatch;
    });

    if (base.length === 0 && weather.rainProb > 50) {
       // Relax rain rule if nothing found
       base = outfits.filter(o => o.seasons && o.seasons.some(s => targetSeasons.has(s)));
    }
    if (base.length === 0 && outfits.length > 0) {
       base = [...outfits];
    }

    const colorsInBase = new Set();
    base.forEach(o => o.colors?.forEach(c => colorsInBase.add(c)));

    let final = base;
    if (homeFilterColor) {
        final = base.filter(o => o.colors && o.colors.includes(homeFilterColor));
    }

    // Sort by most recently added
    final.sort((a, b) => b.id - a.id);
    
    return { homeRecommendations: final, availableColors: Array.from(colorsInBase) };
  }, [outfits, weather, homeFilterColor]); 

  // --- Manage Logic ---
  const manageList = useMemo(() => {
    let filtered = outfits.filter(o => {
        let match = true;
        if (manageFilterColor && (!o.colors || !o.colors.includes(manageFilterColor))) match = false;
        if (manageFilterSeason && (!o.seasons || !o.seasons.includes(manageFilterSeason))) match = false;
        if (manageFilterRainFriendly && o.isNotRainFriendly) match = false;
        return match;
    });
    return filtered.sort((a, b) => b.id - a.id);
  }, [outfits, manageFilterColor, manageFilterSeason, manageFilterRainFriendly]);

  const activeFilterCount = useMemo(() => {
      let count = 0;
      if (manageFilterColor) count++;
      if (manageFilterSeason) count++;
      if (manageFilterRainFriendly) count++;
      return count;
  }, [manageFilterColor, manageFilterSeason, manageFilterRainFriendly]);

  // --- Actions ---

  const handleSelectOutfit = (id) => {
    // Selection disabled for pure browsing mode
  };

  const confirmSelection = () => {
    if (!selectedOutfitId) return;
    setViewState('result');
    handleAIFeedback(outfits.find(o => o.id === selectedOutfitId));
  };

  const resetSelection = () => {
      setViewState('browsing');
  };

  const confirmDelete = () => {
    if (deleteId) {
      setOutfits(outfits.filter(o => o.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleEdit = (outfit, e) => {
    e.stopPropagation();
    setLastView(view); 
    setNewOutfit({
        id: outfit.id,
        image: outfit.image,
        seasons: outfit.seasons || [],
        isNotRainFriendly: outfit.isNotRainFriendly || false,
        colors: outfit.colors || [],
        highlight: outfit.highlight || ""
    });
    setIsFormDirty(false);
    setView('create'); // Switch to create view
  };

  const handleSave = () => {
    if (!newOutfit.image) return alert("請上傳圖片");
    if (!newOutfit.seasons || newOutfit.seasons.length === 0) return alert("請至少選擇一個季節");

    if (newOutfit.id) {
        const updated = outfits.map(o => o.id === newOutfit.id ? newOutfit : o);
        setOutfits(updated);
    } else {
        const created = {
          ...newOutfit,
          id: Date.now(),
        };
        setOutfits([...outfits, created]);
    }
    
    setIsFormDirty(false);
    setView('manage'); 
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateNewOutfit({ image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // --- AI ---
  const handleAIAnalyze = async () => {
    if (!newOutfit.image) return alert("請先上傳圖片！");
    setIsAnalyzing(true);
    try {
      const prompt = `分析圖片: 季節(summer/spring_autumn/winter), 色系(${COLORS.map(c=>c.id).join(',')})。並用繁體中文寫1句簡短的「穿搭亮點」(highlight)，例如：「甜美的粉色系搭配，適合約會！」(15字以內)。回傳JSON格式。`;
      const jsonStr = await generateGeminiContent(prompt, newOutfit.image, true);
      const result = JSON.parse(cleanJsonString(jsonStr)); 
      updateNewOutfit({
        seasons: result.seasons || newOutfit.seasons,
        colors: result.colors || newOutfit.colors,
        highlight: result.highlight || ""
      });
    } catch (e) {
        console.error("AI Analyze Error:", e);
        alert("AI 分析失敗，請手動輸入");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateGeminiContent = async (prompt, imageBase64 = null, returnJson = false) => {
    try {
      const payload = {
        contents: [{ parts: [{ text: prompt }, ...(imageBase64 && imageBase64.includes(',') ? [{ inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } }] : [])] }]
      };
      if (returnJson) {
         if (prompt.includes("分析圖片")) {
             payload.generationConfig = { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { seasons: { type: "ARRAY", items: { type: "STRING", enum: ["summer", "spring_autumn", "winter"] } }, colors: { type: "ARRAY", items: { type: "STRING", enum: COLORS.map(c => c.id) } }, highlight: { type: "STRING" } } } };
         } else {
             payload.generationConfig = { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { compliment: { type: "STRING" }, highlight: { type: "STRING" } } } };
         }
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API Request Failed");
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error(error); throw error;
    }
  };

  const handleAIFeedback = async (outfit) => {
    setIsGeneratingComment(true);
    try {
      const prompt = `
        現在${weather.name}天氣${weather.minTemp}-${weather.maxTemp}度，降雨機率${weather.rainProb}%。
        這套衣服包含：${outfit.seasons.join(',')}季, 顏色:${outfit.colors.join(',')}。
        請針對這套穿搭進行點評，回傳 JSON 格式：
        { 
          "compliment": "一句充滿熱情、情緒價值的誇獎(30-50字)", 
          "highlight": "這套穿搭的一個具體亮點或特色分析(30字)" 
        }。
        請用繁體中文，語氣極度正面、鼓勵，加上emoji。
      `;
      const jsonStr = await generateGeminiContent(prompt, null, true);
      const result = JSON.parse(cleanJsonString(jsonStr)); 
      setAiFeedback(result);
    } catch (e) {
        console.error("AI Feedback Error:", e);
        setAiFeedback({ compliment: "這套穿搭太棒了，簡直是為你量身打造的！", highlight: "自信就是你最好的時尚單品！" });
    } finally {
      setIsGeneratingComment(false);
    }
  };

  // --- Shared UI ---
  const SeasonBadge = ({ seasonId, minimal = false }) => {
    const s = SEASONS.find(x => x.id === seasonId);
    return s ? <span className={`inline-flex items-center gap-1 rounded-md font-medium ${s.color} ${minimal ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>{!minimal && <s.icon size={12}/>}{s.label}</span> : null;
  };

  const EmptyState = ({ message, subMessage, action }) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in bg-white/40 backdrop-blur-sm rounded-3xl border border-white/60 mx-4 mt-8">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-400">
            <Shirt size={40} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{message}</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">{subMessage}</p>
        <button onClick={action} className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-rose-200 transition-all flex items-center gap-2">
            <Plus size={20} /> 新增第一套
        </button>
    </div>
  );

  // --- Sub-components for Layout ---
  const TabBarDesktop = () => (
    <div className="flex gap-4">
        <button onClick={() => switchTab('home')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${view === 'home' ? 'bg-rose-50 text-rose-500 font-bold' : 'text-gray-400 hover:bg-white/50'}`}>
            <LayoutGrid size={20} /> 今日穿搭
        </button>
        <button onClick={() => switchTab('create')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${view === 'create' ? 'bg-rose-50 text-rose-500 font-bold' : 'text-gray-400 hover:bg-white/50'}`}>
            <Plus size={20} /> 新增
        </button>
        <button onClick={() => switchTab('manage')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${view === 'manage' ? 'bg-rose-50 text-rose-500 font-bold' : 'text-gray-400 hover:bg-white/50'}`}>
            <Shirt size={20} /> 全部穿搭
        </button>
    </div>
  );

  const TabBarMobile = () => (
    <div className="fixed bottom-0 left-0 right-0 h-[64px] pb-safe bg-white/90 backdrop-blur-xl border-t border-gray-200 z-[40] grid grid-cols-3 items-start pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] md:hidden">
        {/* Left Button */}
        <button onClick={() => switchTab('home')} className={`flex flex-col items-center justify-center gap-1 transition-all ${view === 'home' ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid size={24} strokeWidth={view === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide">今日穿搭</span>
        </button>
        
        {/* Center Floating Plus Button - Fixed Style */}
        <div className="flex justify-center -mt-6">
            <button onClick={() => switchTab('create')} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 border-4 border-[#fdf2f8] ${view === 'create' ? 'bg-rose-600 text-white' : 'bg-rose-500 text-white'}`}>
                <Plus size={32} strokeWidth={3} />
            </button>
        </div>

        {/* Right Button */}
        <button onClick={() => switchTab('manage')} className={`flex flex-col items-center justify-center gap-1 transition-all ${view === 'manage' ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}>
            <Shirt size={24} strokeWidth={view === 'manage' ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide">全部穿搭</span>
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdf2f8] text-gray-800 font-sans pb-28 md:pb-10 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="hidden md:block text-2xl font-bold text-gray-800 tracking-tight">今天穿什麼</div>
          <div className="hidden md:block">
             <TabBarDesktop />
          </div>
        </div>

        {view === 'home' && (
          <div className="animate-fade-in">
             {/* Weather Bar (Card Style) */}
             <div className="mb-6 p-5 rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white shadow-lg flex items-center justify-between gap-4 relative overflow-hidden">
                {/* Decorative background blob inside card */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-60"></div>
                
                <div className="relative z-10 flex items-center gap-4 w-full">
                    {/* Icon Box */}
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500 shrink-0">
                       {weather.rainProb > 50 ? <CloudRain size={28} className="text-blue-500"/> : <Sun size={28} className="text-orange-500"/>}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <button 
                                onClick={() => setIsLocationModalOpen(true)}
                                className="flex items-center gap-1 group rounded-lg hover:bg-gray-100/50 p-1 -ml-1 transition-colors"
                            >
                                <h2 className="text-gray-800 font-bold text-xl tracking-tight">{weather.name}</h2>
                                <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600"/>
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                             <span className="text-sm font-bold text-gray-600">
                                {weather.minTemp}°C - {weather.maxTemp}°C
                             </span>
                             <span className="text-sm font-bold text-blue-600">
                                降雨 {weather.rainProb}%
                             </span>
                        </div>
                    </div>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4 px-2 md:hidden">今天穿什麼</h1>
            
            {outfits.length === 0 ? (
                <EmptyState 
                    message="衣櫃空空如也！" 
                    subMessage="快去新增你的第一套穿搭，讓 AI 幫你決定明天穿什麼吧！"
                    action={() => switchTab('create')}
                />
            ) : (
                <>
                    {/* Filter Bar */}
                    <div className="mb-4 space-y-3">
                        <div className="overflow-x-auto pb-2 scrollbar-hide">
                            <div className="flex gap-2 px-1">
                                <button onClick={() => setHomeFilterColor(null)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${!homeFilterColor ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200' : 'bg-white text-gray-500 border-transparent shadow-sm'}`}>全部</button>
                                {COLORS.filter(c => availableColors.includes(c.id)).map(c => (
                                    <button key={c.id} onClick={() => setHomeFilterColor(homeFilterColor === c.id ? null : c.id)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border transition-all ${homeFilterColor === c.id ? 'bg-white ring-2 ring-rose-400 border-transparent shadow-md' : 'bg-white border-transparent shadow-sm hover:bg-gray-50'}`}>
                                            <div className="w-3 h-3 rounded-full border border-gray-100" style={{backgroundColor: c.hex}}></div>
                                            <span className={`text-xs ${homeFilterColor === c.id ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{c.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid - Clean Image Only Cards - NO SELECTION INTERACTION */}
                    {homeRecommendations.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 mb-32 md:mb-24 px-1">
                        {homeRecommendations.map((outfit) => {
                            const isSelected = selectedOutfitId === outfit.id;
                            return (
                            <div key={outfit.id} onClick={() => handleSelectOutfit(outfit.id)} className={`relative group cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border ${isSelected ? 'border-rose-400 ring-4 ring-rose-100' : 'border-white/60'}`}>
                                <div className="aspect-[3/4] bg-gray-100 relative">
                                    <img src={outfit.image} alt="Outfit" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    
                                    {/* Rain Indicator Overlay */}
                                    {outfit.isNotRainFriendly && (
                                        <div className="absolute bottom-2 right-2">
                                            <span className="bg-white/90 backdrop-blur-md text-gray-400 text-[10px] w-7 h-7 flex items-center justify-center rounded-full shadow-sm" title="不宜雨天">
                                                <Umbrella size={14} className="line-through"/>
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Simple Tags at bottom left */}
                                    <div className="absolute bottom-2 left-2 flex gap-1">
                                        {outfit.seasons && outfit.seasons.map(sid => { const s = SEASONS.find(x => x.id === sid); return s ? <div key={sid} className={`w-2 h-2 rounded-full ${s.color.split(' ')[0]} border border-white`} title={s.label}></div> : null; })}
                                    </div>
                                </div>
                            </div>
                            )
                        })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/50 rounded-3xl border border-white border-dashed mx-1">
                            <p className="text-gray-500 text-sm">沒有符合條件的穿搭 Q_Q</p>
                            {homeFilterColor && <p className="text-xs text-gray-400 mt-1">試著取消顏色篩選？</p>}
                        </div>
                    )}
                </>
            )}
          </div>
        )}

        {/* CREATE VIEW (Previously Modal) */}
        {view === 'create' && (
          <div className="animate-fade-in pb-4">
             <div className="bg-white shadow-xl border border-gray-100 rounded-[24px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 flex-none bg-white">
                    <div className="flex items-center gap-3">
                        <button onClick={handleCancelCreate} className="md:hidden p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-100">
                             <ChevronLeft size={24}/>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {newOutfit.id ? '編輯穿搭' : '新增穿搭'}
                            {isAnalyzing && <span className="text-xs font-normal text-rose-500 animate-pulse flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> AI</span>}
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCancelCreate} className="hidden md:block text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            取消
                        </button>
                    </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="p-4 md:p-6 space-y-5">
                    <div className="flex flex-col gap-3">
                        <div className="w-full aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-rose-300 transition-colors">
                            {newOutfit.image ? (
                                <img src={newOutfit.image} className="w-full h-full object-cover" alt="Preview"/>
                            ) : (
                                <div className="text-center p-4 text-gray-400">
                                    <Camera size={36} className="mx-auto mb-2 opacity-30"/>
                                    <p className="text-xs font-medium">點擊上傳照片</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {newOutfit.image && (
                                <button onClick={(e) => {e.stopPropagation(); updateNewOutfit({image: ''})}} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-sm text-gray-500 hover:text-red-500"><Trash2 size={16}/></button>
                            )}
                        </div>
                        <button onClick={handleAIAnalyze} disabled={!newOutfit.image || isAnalyzing} className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${!newOutfit.image ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200 active:scale-95'}`}>
                           {isAnalyzing ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>} 
                           <span>AI 自動辨識</span>
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">適合季節</label>
                            <div className="flex gap-2">
                                {SEASONS.map(s => {
                                    const isSelected = newOutfit.seasons && newOutfit.seasons.includes(s.id);
                                    return (
                                        <button key={s.id} onClick={() => toggleSeason(s.id)} className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-xl text-xs font-bold border transition-all ${isSelected ? `${s.color} border-current shadow-sm` : 'bg-white border-gray-200 text-gray-400 hover:bg-white/80'}`}>
                                            <s.icon size={14} /> {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">主要色系</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => {
                                    const isSelected = newOutfit.colors && newOutfit.colors.includes(c.id);
                                    return (
                                        <button key={c.id} onClick={() => toggleColor(c.id)} className={`w-7 h-7 rounded-full border shadow-sm transition-all flex items-center justify-center ${isSelected ? 'scale-110 ring-2 ring-rose-400 border-rose-300 shadow-sm' : 'border-gray-200 opacity-60 hover:opacity-100'}`} style={{backgroundColor: c.hex}} title={c.label}>
                                            {isSelected && <Check size={12} className={c.id === 'white' ? 'text-black' : 'text-white'} strokeWidth={3} />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => updateNewOutfit({ isNotRainFriendly: !newOutfit.isNotRainFriendly })} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${newOutfit.isNotRainFriendly ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${newOutfit.isNotRainFriendly ? 'bg-red-200 text-red-600' : 'bg-gray-100 text-gray-400'}`}><CloudRain size={20}/></div>
                            <div className="text-left"><span className={`text-sm font-bold block ${newOutfit.isNotRainFriendly ? 'text-red-700' : 'text-gray-600'}`}>下雨天不穿</span><span className="text-[10px] text-gray-400">若材質怕水或易髒請勾選</span></div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${newOutfit.isNotRainFriendly ? 'bg-red-500 border-red-500' : 'border-gray-200 bg-white'}`}>{newOutfit.isNotRainFriendly && <Check size={14} className="text-white"/>}</div>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-gray-100 flex-none bg-white flex gap-3">
                    <button onClick={handleCancelCreate} className="flex-1 bg-white hover:bg-gray-50 text-gray-500 font-bold py-4 rounded-2xl border border-gray-200 transition-all active:scale-95 text-sm">取消</button>
                    <button onClick={handleSave} className="flex-[2] bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-rose-200 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"><Check size={18}/> {newOutfit.id ? '儲存修改' : '完成建立'}</button>
                </div>
             </div>
          </div>
        )}

        {view === 'manage' && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-end mb-4 px-1">
                 <h2 className="text-2xl font-bold text-gray-800">全部穿搭</h2>
                 <div className="flex items-center gap-2">
                     <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-full transition-all ${showFilters || activeFilterCount > 0 ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'bg-white text-gray-500 shadow-sm'}`}>
                         <Filter size={18}/>
                     </button>
                     <span className="text-gray-500 text-xs bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">{manageList.length} 件</span>
                 </div>
             </div>

             {/* Filters */}
             {showFilters && (
                <div className="mb-6 p-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm animate-fade-in space-y-4 mx-1">
                    <div>
                        <span className="text-xs font-bold text-gray-400 mb-2 block uppercase">季節</span>
                        <div className="flex gap-2">
                             <button onClick={() => setManageFilterSeason(null)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${!manageFilterSeason ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>全部</button>
                             {SEASONS.map(s => (
                                <button key={s.id} onClick={() => setManageFilterSeason(manageFilterSeason === s.id ? null : s.id)} className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1 transition-colors ${manageFilterSeason === s.id ? s.color : 'bg-white text-gray-500 border-gray-200'}`}>
                                    {s.label}
                                </button>
                             ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 mb-2 block uppercase">顏色</span>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setManageFilterColor(null)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${!manageFilterColor ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>全部</button>
                             {COLORS.map(c => (
                                 <button key={c.id} onClick={() => setManageFilterColor(manageFilterColor === c.id ? null : c.id)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-transform ${manageFilterColor === c.id ? 'ring-2 ring-gray-400 scale-110' : 'opacity-70'}`} style={{backgroundColor: c.hex}}>
                                     {manageFilterColor === c.id && <Check size={12} className={c.id === 'white' ? 'text-black' : 'text-white'}/>}
                                 </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 mb-2 block uppercase">特殊條件</span>
                        <div className="flex gap-2">
                            <button onClick={() => setManageFilterRainFriendly(!manageFilterRainFriendly)} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${manageFilterRainFriendly ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                                <Umbrella size={14}/> 雨天OK
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {outfits.length === 0 ? (
                 <EmptyState 
                    message="還沒有任何衣物" 
                    subMessage="開始整理你的衣櫃，讓生活更有條理！"
                    action={() => switchTab('create')}
                 />
             ) : (
                 <div className="flex flex-col gap-3 pb-20">
                    {manageList.length > 0 ? manageList.map(outfit => (
                        <div key={outfit.id} className="flex bg-white rounded-2xl p-3 border border-gray-100 shadow-sm items-start gap-4">
                            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                <img src={outfit.image} className="w-full h-full object-cover" alt="Outfit"/>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-wrap gap-1">
                                        {outfit.seasons.map(sid => <SeasonBadge key={sid} seasonId={sid} minimal />)}
                                        {outfit.isNotRainFriendly && <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-500"><Umbrella size={10} className="line-through mr-0.5"/> 怕水</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => handleEdit(outfit, e)} className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={16}/></button>
                                        <button onClick={() => setDeleteId(outfit.id)} className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                
                                {/* Highlight Text in Manage View (Full Sentence) */}
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    {outfit.highlight || "✨ 這套穿搭很有個人風格喔！"}
                                </p>

                                <div className="flex gap-1 mt-auto">
                                    {outfit.colors.map(cid => { const c = COLORS.find(x => x.id === cid); return c ? <div key={cid} className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{backgroundColor: c.hex}}></div> : null; })}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-gray-400 text-sm">找不到符合篩選條件的衣物</div>
                    )}
                 </div>
             )}

             {/* Custom Delete Modal */}
             {deleteId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-white/50">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                <AlertCircle size={24}/>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">確定要刪除嗎？</h3>
                                <p className="text-sm text-gray-500 mt-1">刪除後無法復原喔！</p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">取消</button>
                                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200">刪除</button>
                            </div>
                        </div>
                    </div>
                </div>
             )}
          </div>
        )}

        {/* Location Modal */}
        {isLocationModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
                <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-lg">選擇地區</h3>
                        <button onClick={() => setIsLocationModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={18}/></button>
                    </div>
                    <div className="overflow-y-auto p-4 space-y-2 scrollbar-hide">
                        {LOCATIONS.map((loc, index) => (
                            <button 
                                key={index}
                                onClick={() => { setLocationIndex(index); setIsLocationModalOpen(false); }}
                                className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${locationIndex === index ? 'bg-rose-50 border border-rose-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className={`font-bold ${locationIndex === index ? 'text-rose-600' : 'text-gray-800'}`}>{loc.name}</span>
                                    <span className="text-xs text-gray-400">{loc.country}</span>
                                </div>
                                {locationIndex === index && <Check size={20} className="text-rose-500"/>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      <TabBarMobile />

      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.4s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        /* Mobile safe area spacing */
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
}