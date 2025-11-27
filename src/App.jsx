import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { RefreshCw, History, Info, Sparkles, Trash2, TrendingUp, BarChart3, ChevronDown, ChevronUp, Layers, Minus, Plus, X, BarChart2, AlertTriangle, ExternalLink, CheckCircle2, ArrowUpRight, Repeat, Zap, Award, Copy, Check, Pin, PinOff, Upload, Database, Save, RefreshCcw, Users, DollarSign, PieChart, Calendar, Clock, FileSpreadsheet, Flame } from 'lucide-react';

// --- 기본 설정 ---
const TARGET_EXCEL_URL = "https://superkts.com/lotto/download_excel.php";
const CORS_PROXY = "https://corsproxy.io/?"; 
const EXCEL_URL = CORS_PROXY + encodeURIComponent(TARGET_EXCEL_URL);

// 로또 공 색상
const getBallColor = (num) => {
  // [수정] 빈 공(placeholder) 스타일 추가
  if (num === '?') return 'bg-slate-800/50 text-slate-500 border-slate-600 border-dashed shadow-inner';
  
  if (num <= 10) return 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-400/50';
  if (num <= 20) return 'bg-blue-500 text-white border-blue-600 shadow-blue-500/50';
  if (num <= 30) return 'bg-red-500 text-white border-red-600 shadow-red-500/50';
  if (num <= 40) return 'bg-gray-500 text-white border-gray-600 shadow-gray-500/50';
  return 'bg-green-500 text-white border-green-600 shadow-green-500/50';
};

// 이월수 체크 유틸
const checkRepeat = (currentRoundNums, prevRoundNums) => {
    if (!prevRoundNums) return [];
    return currentRoundNums.filter(num => prevRoundNums.includes(num));
};

// 로또 볼 컴포넌트
const LottoBall = ({ number, index, isNew, isFadingOut, size = "large", isRepeat = false }) => {
  if (number === null || number === undefined) return null;
  const isBoard = size === "board";
  const sizeClasses = size === "small" || isBoard
    ? "w-6 h-6 sm:w-7 sm:h-7 text-xs border-b-2" 
    : "w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl border-b-4";

  // 빈 공일 때는 애니메이션이나 특수 효과 제외
  const isPlaceholder = number === '?';

  return (
    <div className="relative group">
        <div
        className={`
            ${sizeClasses} rounded-full flex items-center justify-center 
            font-bold transform transition-all duration-300 flex-shrink-0
            ${getBallColor(number)}
            ${!isPlaceholder && isNew && !isFadingOut ? 'scale-0 opacity-0 animate-pop-in' : ''}
            ${isFadingOut ? 'scale-50 opacity-0 translate-y-10' : 'scale-100 opacity-100'}
            ${isRepeat ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-slate-800 z-10' : ''}
        `}
        style={{
            animationDelay: !isPlaceholder && isNew ? `${index * 0.1}s` : '0s',
            transitionDelay: isFadingOut ? `${index * 0.05}s` : '0s',
            animationFillMode: 'forwards'
        }}
        >
        <span className="drop-shadow-md">{number}</span>
        {!isPlaceholder && size !== "small" && size !== "board" && (
            <div className="absolute top-1 left-2 w-3 h-2 bg-white/40 rounded-full blur-[1px]"></div>
        )}
        </div>
        {isRepeat && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-lg animate-bounce z-20 flex items-center gap-0.5">
                <ArrowUpRight size={8} strokeWidth={3} />
                {!isBoard && <span>이월</span>}
            </div>
        )}
    </div>
  );
};

export default function App() {
  const [numbers, setNumbers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]); 
  const [mode, setMode] = useState('weighted');
  const [showInfo, setShowInfo] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [currentRound, setCurrentRound] = useState(0); 
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsTab, setStatsTab] = useState('history');
  
  const [winningHistory, setWinningHistory] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataSource, setDataSource] = useState('none'); 
  const [lastUpdate, setLastUpdate] = useState(null);
  const [displayCount, setDisplayCount] = useState(50);

  const [copyFeedbackId, setCopyFeedbackId] = useState(null);
  const [globalCopyFeedback, setGlobalCopyFeedback] = useState(false);

  const loadXLSX = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.XLSX) {
        resolve(window.XLSX);
        return;
      }
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; 
      script.onload = () => resolve(window.XLSX);
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }, []);

  const processExcelData = useCallback((arrayBuffer) => {
      try {
          const wb = window.XLSX.read(arrayBuffer, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = window.XLSX.utils.sheet_to_json(ws, { header: 1 });

          const parsedData = [];
          let startIndex = -1;
          
          for(let i=0; i<20; i++) {
              const row = data[i];
              if (row && !isNaN(parseInt(row[0])) && parseInt(row[0]) > 0 && row.length >= 8) {
                  startIndex = i;
                  break;
              }
          }

          if (startIndex === -1) throw new Error("데이터 형식을 인식할 수 없습니다.");

          for (let i = startIndex; i < data.length; i++) {
              const row = data[i];
              if (!row || row.length < 8) continue;

              const round = parseInt(row[0]);
              if (isNaN(round)) continue;

              const nums = [
                  parseInt(row[1]), parseInt(row[2]), parseInt(row[3]),
                  parseInt(row[4]), parseInt(row[5]), parseInt(row[6])
              ];
              const bonus = parseInt(row[7]);

              const val1 = parseInt(String(row[8] || 0).replace(/,/g, '')) || 0;
              const val2 = parseInt(String(row[9] || 0).replace(/,/g, '')) || 0;
              const prizeAmount = Math.max(val1, val2);
              const winnerCount = Math.min(val1, val2);

              if (nums.some(n => isNaN(n) || n < 1 || n > 45) || isNaN(bonus)) continue;

              parsedData.push({ round, numbers: nums, bonus, winnerCount, prizeAmount });
          }

          if (parsedData.length > 0) {
              parsedData.sort((a, b) => b.round - a.round); 
              localStorage.setItem('lotto_winning_history', JSON.stringify(parsedData));
              
              const now = new Date().toLocaleString();
              localStorage.setItem('lotto_last_update', now);
              setLastUpdate(now);

              setWinningHistory(parsedData);
              setDataSource('fetched');
              return parsedData.length;
          } else {
              throw new Error("추출된 데이터가 없습니다.");
          }

      } catch (error) {
          console.error("Parsing Error:", error);
          throw error;
      }
  }, []);

  const initData = useCallback(async (force = false) => {
      const savedData = localStorage.getItem('lotto_winning_history');
      const savedUpdate = localStorage.getItem('lotto_last_update');
      
      if (!force && savedData) {
          try {
              const parsed = JSON.parse(savedData);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  setWinningHistory(parsed);
                  setDataSource('local');
                  setLastUpdate(savedUpdate);
                  return;
              }
          } catch (e) {
              localStorage.removeItem('lotto_winning_history');
          }
      }

      setIsDataLoading(true);
      try {
          await loadXLSX(); 
          const response = await fetch(EXCEL_URL);
          if (!response.ok) throw new Error(`Network error: ${response.status}`);
          
          const arrayBuffer = await response.arrayBuffer();
          const count = processExcelData(arrayBuffer);
          
          if(force) alert(`전체 데이터 업데이트 완료! (총 ${count}회차)`);
      } catch (error) {
          console.warn("데이터 가져오기 실패:", error);
          if (force) alert("데이터를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
          setIsDataLoading(false);
      }
  }, [loadXLSX, processExcelData]);

  useEffect(() => {
      initData(false); 
  }, []);

  const resetData = () => {
      if(confirm("저장된 데이터를 모두 삭제하고 초기 상태로 돌아가시겠습니까?")) {
          localStorage.removeItem('lotto_winning_history');
          localStorage.removeItem('lotto_last_update');
          setWinningHistory([]);
          setDataSource('none');
          setLastUpdate(null);
          setTimeout(() => initData(true), 500);
      }
  };

  const analysisData = winningHistory;
  const hasData = analysisData.length > 0;

  const numberFrequency = useMemo(() => {
      if (!hasData) return Array(45).fill(0).map((_, i) => ({ number: i + 1, frequency: 0 }));
      const freqs = Array(45).fill(0).map((_, i) => ({ number: i + 1, frequency: 0 }));
      analysisData.forEach(round => {
          round.numbers.forEach(n => {
              if (freqs[n-1]) freqs[n-1].frequency++;
          });
      });
      return freqs;
  }, [analysisData, hasData]);

  const { sectionStats, repeatProbability, currentRepeatStreak, maxSecCount } = useMemo(() => {
    if (!hasData) return { sectionStats: [], repeatProbability: 0, currentRepeatStreak: 0, maxSecCount: 1 };

    const recent15 = analysisData.slice(0, 15);
    const stats = [
        { range: '1~5', start: 1, end: 5, count: 0, color: 'text-yellow-300', barColor: 'bg-yellow-400' },
        { range: '6~10', start: 6, end: 10, count: 0, color: 'text-yellow-500', barColor: 'bg-yellow-600' },
        { range: '11~15', start: 11, end: 15, count: 0, color: 'text-blue-300', barColor: 'bg-blue-400' },
        { range: '16~20', start: 16, end: 20, count: 0, color: 'text-blue-500', barColor: 'bg-blue-600' },
        { range: '21~25', start: 21, end: 25, count: 0, color: 'text-red-300', barColor: 'bg-red-400' },
        { range: '26~30', start: 26, end: 30, count: 0, color: 'text-red-500', barColor: 'bg-red-600' },
        { range: '31~35', start: 31, end: 35, count: 0, color: 'text-gray-300', barColor: 'bg-gray-400' },
        { range: '36~40', start: 36, end: 40, count: 0, color: 'text-gray-500', barColor: 'bg-gray-600' },
        { range: '41~45', start: 41, end: 45, count: 0, color: 'text-green-400', barColor: 'bg-green-500' }
    ];

    let roundsWithRepeats = 0;
    let streak = 0;

    if (recent15.length > 1) {
        const hasRepeat = (idx) => {
            if (idx >= recent15.length - 1) return false;
            const curr = [...recent15[idx].numbers, recent15[idx].bonus];
            const prev = [...recent15[idx+1].numbers, recent15[idx+1].bonus];
            return curr.some(n => prev.includes(n));
        };

        if (hasRepeat(0)) {
            streak = 1;
            for (let i = 1; i < recent15.length - 1; i++) {
                if (hasRepeat(i)) streak++; else break;
            }
        } else {
            streak = -1;
            for (let i = 1; i < recent15.length - 1; i++) {
                if (!hasRepeat(i)) streak--; else break;
            }
        }
    }

    recent15.forEach((round, idx) => {
        const allNums = [...round.numbers, round.bonus];
        allNums.forEach(num => {
            const index = Math.floor((num - 1) / 5);
            if (stats[index]) {
                stats[index].count += 1; 
            }
        });

        if (idx < recent15.length - 1) {
            const currAll = [...round.numbers, round.bonus];
            const prevAll = [...recent15[idx+1].numbers, recent15[idx+1].bonus];
            const repeats = currAll.filter(n => prevAll.includes(n));
            if (repeats.length > 0) roundsWithRepeats += 1;
        }
    });

    const repeatProb = recent15.length > 1 ? roundsWithRepeats / (recent15.length - 1) : 0.2;
    const maxSecCount = Math.max(...stats.map(s => s.count)) || 1;

    return { sectionStats: stats, repeatProbability: repeatProb, currentRepeatStreak: streak, maxSecCount };
  }, [analysisData, hasData]);

  const allNumberWeights = useMemo(() => {
    if (!hasData) return Array(45).fill(0).map((_, i) => ({ number: i + 1, weight: 10, isRepeatCandidate: false, consecutiveCount: 0 }));

    const calculateMean = (data, key) => data.reduce((acc, curr) => acc + curr[key], 0) / data.length;
    const calculateStdDev = (data, mean, key) => {
        const squareDiffs = data.map(item => Math.pow(item[key] - mean, 2));
        return Math.sqrt(squareDiffs.reduce((acc, curr) => acc + curr, 0) / data.length) || 1;
    };
    const normalCDF = (x) => 0.5 * (1 + Math.tanh(x * 0.7978845608 * (1 + 0.044715 * x * x)));

    const numMean = calculateMean(numberFrequency, 'frequency');
    const numStdDev = calculateStdDev(numberFrequency, numMean, 'frequency');

    const secMean = calculateMean(sectionStats, 'count');
    const secStdDev = calculateStdDev(sectionStats, secMean, 'count');

    const lastRound = analysisData[0];
    const lastRoundNumbers = lastRound ? [...lastRound.numbers, lastRound.bonus] : [];

    return numberFrequency.map(stat => {
        let consecutiveCount = 0;
        for (let i = 0; i < analysisData.length; i++) {
            const roundAll = [...analysisData[i].numbers, analysisData[i].bonus];
            if (roundAll.includes(stat.number)) {
                consecutiveCount++;
            } else {
                break;
            }
        }

        const numZ = (stat.frequency - numMean) / numStdDev;
        const baseWeightFactor = 1.0 - normalCDF(numZ); 

        const section = sectionStats.find(s => stat.number >= s.start && stat.number <= s.end);
        let sectionMultiplier = 1.0;
        if (section) {
            const secZ = (section.count - secMean) / secStdDev;
            sectionMultiplier = 1.0 + (Math.abs(secZ) * 0.8); 
        }

        let repeatMultiplier = 1.0;
        let isRepeatCandidate = false;
        let isHotStreak = false;

        if (lastRoundNumbers.includes(stat.number)) {
            isRepeatCandidate = true;
            
            if (consecutiveCount >= 2) {
                repeatMultiplier = 0.2; 
                isHotStreak = true;
            } else {
                let baseMultiplier = 1.0 + repeatProbability;
                if (currentRepeatStreak > 0) {
                    const penalty = Math.min(0.8, currentRepeatStreak * 0.2);
                    repeatMultiplier = Math.max(0.5, baseMultiplier - penalty);
                } else {
                    repeatMultiplier = baseMultiplier;
                }
            }
        }

        const finalWeightFactor = baseWeightFactor * sectionMultiplier * repeatMultiplier;
        const weight = Math.max(1, Math.floor(finalWeightFactor * 100));

        return { number: stat.number, weight, isRepeatCandidate, isHotStreak, consecutiveCount };
    });
  }, [numberFrequency, sectionStats, repeatProbability, currentRepeatStreak, analysisData, hasData]);

  const getWeightedRandomNumber = useCallback((excludeList) => {
    let weightedPool = [];
    allNumberWeights.forEach(item => {
        if (excludeList.includes(item.number)) return;
        for (let i = 0; i < item.weight; i++) weightedPool.push(item.number);
    });
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex] || Math.floor(Math.random() * 45) + 1;
  }, [allNumberWeights]);

  const generateLotto = useCallback(async () => {
    if (!hasData) {
        alert("당첨 데이터를 먼저 불러와주세요!");
        setShowStats(true);
        setStatsTab('manage');
        return;
    }
    if (isGenerating) return;
    
    const pinnedCount = history.filter(h => h.isPinned).length;
    const maxRepeat = Math.max(0, 30 - pinnedCount);
    if (maxRepeat <= 0) return;

    setIsGenerating(true);
    setCurrentRound(0);
    if (repeatCount > 1) setShowHistoryList(true);

    for (let round = 1; round <= repeatCount; round++) {
      setCurrentRound(round);
      setIsFadingOut(false);
      setNumbers([]);

      const currentSet = [];
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 공 추출 (0.2초)
        let pickedNum;
        if (mode === 'weighted') {
          pickedNum = getWeightedRandomNumber(currentSet);
        } else {
          do { pickedNum = Math.floor(Math.random() * 45) + 1; } while (currentSet.includes(pickedNum));
        }
        currentSet.push(pickedNum);
        setNumbers([...currentSet]);
      }

      await new Promise(resolve => setTimeout(resolve, 400)); // 정렬 대기 (0.4초)
      const sortedSet = [...currentSet].sort((a, b) => a - b);
      setNumbers(sortedSet);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 확인 시간 (1초)

      const newRecord = {
        id: Date.now() + Math.random(),
        date: new Date().toLocaleTimeString(),
        nums: sortedSet,
        mode: mode,
        isNew: true,
        isPinned: false
      };

      setHistory(prev => {
          const pinnedItems = prev.filter(item => item.isPinned);
          const unpinnedItems = prev.filter(item => !item.isPinned);
          const availableSpaceForUnpinned = 30 - pinnedItems.length - 1; 
          const keptUnpinnedItems = unpinnedItems.slice(0, availableSpaceForUnpinned);
          return [newRecord, ...pinnedItems, ...keptUnpinnedItems].sort((a, b) => b.id - a.id);
      });
      await new Promise(resolve => setTimeout(resolve, 300)); // 다음 대기 (0.3초)
    }
    setNumbers([]);
    setIsFadingOut(false);
    setIsGenerating(false);
    setCurrentRound(0);
  }, [isGenerating, mode, repeatCount, getWeightedRandomNumber, history, hasData]);

  const MAX_HISTORY = 30;
  const pinnedCount = history.filter(h => h.isPinned).length;
  const maxRepeatCount = Math.max(0, MAX_HISTORY - pinnedCount);

  const copyToClipboard = (text, id = null) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      if (id) { setCopyFeedbackId(id); setTimeout(() => setCopyFeedbackId(null), 2000); }
      else { setGlobalCopyFeedback(true); setTimeout(() => setGlobalCopyFeedback(false), 2000); }
    } catch (err) { console.error('Copy failed', err); }
    document.body.removeChild(textArea);
  };

  const handleCopyAll = (e) => { e.stopPropagation(); copyToClipboard(history.map(r => r.nums.join(', ')).join('\n')); };
  const handleCopyItem = (e, record) => { e.stopPropagation(); copyToClipboard(record.nums.join(', '), record.id); };
  const togglePin = (e, id) => { e.stopPropagation(); setHistory(prev => prev.map(i => i.id === id ? { ...i, isPinned: !i.isPinned } : i)); };
  const pinAll = (e) => { e.stopPropagation(); setHistory(prev => prev.map(i => ({ ...i, isPinned: true }))); };
  const unpinAll = (e) => { e.stopPropagation(); setHistory(prev => prev.map(i => ({ ...i, isPinned: false }))); };
  const deleteItem = (e, id) => { e.stopPropagation(); setHistory(prev => prev.filter(i => i.id !== id)); };
  const clearHistory = () => { setHistory(prev => prev.filter(i => i.isPinned)); };
  const increaseRepeat = () => setRepeatCount(prev => Math.min(prev + 1, maxRepeatCount > 0 ? Math.min(10, maxRepeatCount) : 0));
  const decreaseRepeat = () => setRepeatCount(prev => Math.max(prev - 1, 1));

  const maxWeight = Math.max(...allNumberWeights.map(w => w.weight));
  const topRecommended = [...allNumberWeights].sort((a, b) => b.weight - a.weight).slice(0, 7).map(i => i.number);
  const handleLoadMore = () => setDisplayCount(prev => Math.min(prev + 50, winningHistory.length));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans overflow-x-hidden pb-20">
      <style>{`
        @keyframes pop-in { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 70% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-20px); max-height: 0; margin-bottom: 0; } to { opacity: 1; transform: translateY(0); max-height: 100px; margin-bottom: 0.75rem; } }
        .animate-slide-down { animation: slide-down 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; overflow: hidden; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes modal-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-modal-scale { animation: modal-scale 0.2s ease-out forwards; }
      `}</style>

      {/* 통계 모달 */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowStats(false)}>
          <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-modal-scale overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="p-4 sm:p-6 border-b border-slate-700 flex flex-col lg:flex-row items-center justify-between bg-slate-900/50 gap-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="text-pink-400" />
                <div>
                    <h2 className="text-xl font-bold text-white">당첨 데이터 센터</h2>
                    <p className="text-xs text-slate-400">
                        {hasData ? `${winningHistory.length}회차 데이터 보유 (최신: ${winningHistory[0].round}회)` : '데이터 없음'}
                    </p>
                </div>
              </div>
              <div className="flex bg-slate-900/80 rounded-lg p-1 overflow-x-auto max-w-full no-scrollbar">
                <button onClick={() => setStatsTab('history')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${statsTab === 'history' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>역대 당첨결과</button>
                <button onClick={() => setStatsTab('weights')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${statsTab === 'weights' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}>AI 가중치</button>
                <button onClick={() => setStatsTab('section')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${statsTab === 'section' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>구간별(15주)</button>
                <button onClick={() => setStatsTab('number')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${statsTab === 'number' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>번호별(전체)</button>
                <button onClick={() => setStatsTab('manage')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${statsTab === 'manage' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}><Database size={14}/> 데이터 관리</button>
              </div>
              <button onClick={() => setShowStats(false)}><X size={24} className="text-slate-400 hover:text-white" /></button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              {statsTab === 'manage' && (
                  <div className="space-y-6 text-center">
                      <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-8 mb-6 flex flex-col items-center">
                          <div className="p-4 bg-blue-500/20 rounded-full text-blue-400 mb-4">
                              {isDataLoading ? <RefreshCw size={32} className="animate-spin"/> : <FileSpreadsheet size={32} />}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">데이터 자동 업데이트</h3>
                          <p className="text-sm text-slate-400 mb-6 max-w-md">
                              현재 <strong>{winningHistory.length}회차</strong> 데이터가 저장되어 있습니다.<br/>
                              최신 회차가 나오면 자동으로 업데이트를 확인합니다.<br/>
                              <span className="text-xs opacity-70">(마지막 업데이트: {lastUpdate || '없음'})</span>
                          </p>
                          <button 
                              onClick={() => initData(true)}
                              disabled={isDataLoading}
                              className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                          >
                              {isDataLoading ? <RefreshCw className="animate-spin"/> : <RefreshCcw size={20}/>}
                              {isDataLoading ? '데이터 가져오는 중...' : '최신 데이터 확인하기'}
                          </button>
                      </div>
                      <div className="border-t border-slate-700 pt-6">
                          <button onClick={resetData} className="text-sm text-red-400 hover:text-red-300 hover:underline flex items-center justify-center gap-1 mx-auto">
                              <Trash2 size={14}/> 데이터 초기화
                          </button>
                      </div>
                  </div>
              )}

              {statsTab === 'history' && (
                <div className="space-y-4">
                    <div className="text-xs text-slate-400 text-right mb-2">
                        총 <span className="text-white font-bold">{winningHistory.length}</span>회차 데이터 보유 중
                    </div>
                    <div className="overflow-x-auto bg-black/20 rounded-lg border border-white/5">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-white/5 text-slate-300 text-xs border-b border-white/10">
                                    <th className="p-3 text-center whitespace-nowrap">회차</th>
                                    <th className="p-3 text-center min-w-[200px]">당첨번호</th>
                                    <th className="p-3 text-center whitespace-nowrap">1등 인원</th>
                                    <th className="p-3 text-right whitespace-nowrap">1등 당첨금</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysisData.slice(0, displayCount).map((row, index) => {
                                    const prevRound = analysisData[index + 1];
                                    const prevRoundAll = prevRound ? [...prevRound.numbers, prevRound.bonus] : [];
                                    return (
                                        <tr key={row.round} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3 text-center font-bold text-pink-300">{row.round}회</td>
                                            <td className="p-3">
                                                <div className="flex gap-1 justify-center items-center">
                                                    {row.numbers.map(n => <LottoBall key={n} number={n} size="board" isRepeat={prevRoundAll.includes(n)} />)}
                                                    <Plus size={10} className="text-slate-500 mx-1"/>
                                                    <LottoBall number={row.bonus} size="board" isRepeat={prevRoundAll.includes(row.bonus)} />
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">
                                                    <Users size={10} /> {row.winnerCount ? `${row.winnerCount}명` : '-'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-mono text-yellow-300 text-xs">
                                                {row.prizeAmount ? `₩${row.prizeAmount.toLocaleString('ko-KR')}` : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {winningHistory.length > displayCount && (
                        <button 
                            onClick={handleLoadMore}
                            className="w-full py-3 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-dashed border-slate-700 hover:border-slate-500"
                        >
                            더 보기 ({displayCount} / {winningHistory.length})
                        </button>
                    )}
                </div>
              )}

              {statsTab === 'weights' && (
                  <div className="space-y-4">
                      <div className="bg-pink-900/20 border border-pink-500/30 p-4 rounded-xl flex items-start gap-3">
                          <Zap className="text-pink-400 flex-shrink-0 mt-1" size={18} />
                          <div className="text-xs text-pink-200/90 leading-relaxed">
                              <h3 className="font-bold text-sm text-pink-300 mb-1">AI 추천 가중치 (5x9 Grid)</h3>
                              <p>
                                45개 번호의 <strong>실시간 당첨 가중치</strong>입니다. 점수가 높을수록 추천 확률이 높습니다.<br/>
                                <span className="text-red-400 font-bold flex items-center gap-1 inline-block mt-1"><Flame size={12}/> 불꽃 아이콘</span>은 연속 2회 이상 출현하여 가중치가 낮아진(패널티) 번호입니다.
                              </p>
                          </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 sm:gap-3">
                          {allNumberWeights.map((item) => {
                              const isTop = topRecommended.includes(item.number);
                              return (
                                  <div 
                                    key={item.number} 
                                    className={`
                                        relative flex flex-col items-center justify-center py-2 sm:py-3 rounded-lg border transition-all duration-300
                                        ${isTop 
                                            ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.2)] scale-105 z-10' 
                                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                                        }
                                    `}
                                  >
                                      {isTop && <div className="absolute -top-2 -right-1 bg-yellow-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm z-20">TOP</div>}
                                      {item.isRepeatCandidate && !item.isHotStreak && (
                                          <div className="absolute top-1 left-1" title="이월수 후보">
                                              <Repeat size={10} className="text-blue-400 drop-shadow-md" />
                                          </div>
                                      )}
                                      {item.isHotStreak && (
                                          <div className="absolute top-1 left-1" title="연속 과열 (패널티)">
                                              <Flame size={10} className="text-red-500 drop-shadow-md animate-pulse" />
                                          </div>
                                      )}
                                      <div className={`
                                          w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold shadow-lg mb-1
                                          ${getBallColor(item.number)}
                                      `}>
                                          {item.number}
                                      </div>
                                      <div className="flex flex-col items-center">
                                          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Score</span>
                                          <span className={`text-xs sm:text-sm font-mono font-bold ${isTop ? 'text-yellow-200' : 'text-slate-300'}`}>
                                              {item.weight}
                                          </span>
                                      </div>
                                      <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30 rounded-full mx-2 transition-all"
                                           style={{ 
                                               width: `calc(100% - 16px)`, 
                                               transform: `scaleX(${item.weight / maxWeight})`,
                                               transformOrigin: 'left',
                                               color: isTop ? '#facc15' : '#94a3b8'
                                           }} 
                                      />
                                  </div>
                              )
                          })}
                      </div>
                  </div>
              )}

              {statsTab === 'section' && (
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {sectionStats.map((sec) => (
                              <div key={sec.range} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                  <div className="flex justify-between items-end mb-2">
                                      <div className="flex flex-col">
                                          <span className={`text-lg font-bold ${sec.color}`}>{sec.range}</span>
                                          <span className="text-xs text-slate-400">최근 15주간 출현 횟수</span>
                                      </div>
                                      <span className="text-2xl font-bold">{sec.count}회</span>
                                  </div>
                                  <div className="w-full h-4 bg-slate-700/50 rounded-full overflow-hidden">
                                      <div 
                                          className={`h-full rounded-full ${sec.barColor} transition-all duration-1000`}
                                          style={{ width: `${(sec.count / maxSecCount) * 100}%` }} 
                                      ></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="text-center text-xs text-slate-500 bg-black/20 p-3 rounded-lg border border-white/5">
                        * 분석 대상: 최근 15회 (총 105개 번호 / 보너스 포함)
                      </div>
                  </div>
              )}

              {statsTab === 'number' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {numberFrequency.map((stat) => (
                        <div key={stat.number} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 ${getBallColor(stat.number).replace('border-b-4', 'border-b-2')}`}>
                                {stat.number}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">당첨 횟수</span>
                                    <span className="font-bold text-slate-200">{stat.frequency}회</span>
                                </div>
                                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-slate-400" style={{ width: `${(stat.frequency / Math.max(...numberFrequency.map(f=>f.frequency))) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Sparkles className="text-yellow-400 w-6 h-6" />
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-500">Lotto Master AI</h1>
          </div>
          <p className="text-slate-400 text-sm mb-4">
              {dataSource === 'local' ? '사용자 데이터 기반 분석' : dataSource === 'fetched' ? '최신 데이터 분석' : '기본 데이터 분석'} ({winningHistory.length}회차)
          </p>
          <button onClick={() => { setShowStats(true); setStatsTab('history'); }} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-full transition-colors border border-slate-700">
            <BarChart2 size={16} className="text-pink-400"/> 데이터 관리 및 분석
          </button>
        </header>

        {/* 추첨기 UI */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-6 z-10 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 relative z-20 bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="bg-black/40 p-1 rounded-full flex text-xs sm:text-sm">
                    <button onClick={() => setMode('random')} disabled={isGenerating} className={`px-3 py-1.5 rounded-full transition-all ${mode === 'random' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>랜덤</button>
                    <button onClick={() => setMode('weighted')} disabled={isGenerating} className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${mode === 'weighted' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-slate-400'}`}>AI 분석 <Info size={12}/></button>
                </div>
                <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                    <button onClick={decreaseRepeat} disabled={isGenerating || repeatCount <= 1} className="w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-slate-200"><Minus size={14}/></button>
                    <div className="w-10 text-center font-bold text-lg text-pink-300 tabular-nums">{repeatCount}</div>
                    <button onClick={increaseRepeat} disabled={isGenerating || repeatCount >= maxRepeatCount} className="w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-slate-200"><Plus size={14}/></button>
                </div>
            </div>

            <div className="h-28 sm:h-36 flex items-center justify-center gap-2 sm:gap-3 mb-6 relative">
                {numbers.length === 0 && !isGenerating ? (
                <div className="flex gap-2 sm:gap-3">
                    {Array(6).fill('?').map((_, i) => (
                        <LottoBall key={i} number="?" index={i} isNew={true} />
                    ))}
                </div>
                ) : (
                numbers.map((num, idx) => <LottoBall key={`${idx}-${num}`} number={num} index={idx} isNew={true} isFadingOut={isFadingOut} />)
                )}
            </div>

            <button onClick={generateLotto} disabled={isGenerating || maxRepeatCount === 0} className={`w-full py-4 rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${isGenerating ? 'bg-slate-700 cursor-wait text-slate-400' : maxRepeatCount === 0 ? 'bg-red-900/50 cursor-not-allowed text-red-200' : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-400 text-white'}`}>
                {isGenerating ? <><RefreshCw className="animate-spin"/> 생성 중...</> : maxRepeatCount === 0 ? <><AlertTriangle size={20}/> 보관함 가득 참</> : <><Sparkles/> 번호 생성하기</>}
            </button>
        </div>

        <button onClick={() => setShowHistoryList(!showHistoryList)} className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-all mb-4">
            <History size={18}/> <span>{history.length > 0 ? `생성 이력 확인 (${history.length}/${MAX_HISTORY})` : '생성 이력'}</span> {showHistoryList ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {showHistoryList && (
            <div className="animate-fade-in pb-10">
                <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                    <div className="text-xs text-slate-400"><span className="text-pink-300 font-bold">{pinnedCount}</span>개 고정됨 / <span className="text-slate-300">{MAX_HISTORY - history.length}</span>자리 남음</div>
                    <div className="flex gap-2 flex-wrap justify-end">
                        <button onClick={pinAll} className="text-xs bg-slate-800 hover:text-yellow-400 border border-slate-700 rounded-lg flex items-center gap-1 px-3 py-1.5"><Pin size={12}/> 전체 고정</button>
                        <button onClick={unpinAll} className="text-xs bg-slate-800 hover:text-white border border-slate-700 rounded-lg flex items-center gap-1 px-3 py-1.5"><PinOff size={12}/> 전체 해제</button>
                        <button onClick={handleCopyAll} className="text-xs bg-slate-800 hover:text-white border border-slate-700 rounded-lg flex items-center gap-1 px-3 py-1.5">{globalCopyFeedback ? <Check size={12} className="text-green-400"/> : <Copy size={12}/>} 전체 복사</button>
                        <button onClick={clearHistory} className="text-xs bg-slate-800 hover:text-red-400 border border-slate-700 rounded-lg flex items-center gap-1 px-3 py-1.5"><Trash2 size={12}/> 전체 삭제</button>
                    </div>
                </div>
                <div className="space-y-0">
                    {history.map((record, index) => (
                        <div key={record.id} className={`bg-white/5 border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 mb-3 ${record.isNew ? 'animate-slide-down' : ''} ${record.isPinned ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10 hover:bg-white/10'}`}>
                            <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs text-slate-400 font-mono">{history.length - index}</div>
                            <div className="flex gap-2">{record.nums.map((n, i) => <span key={i} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md ${getBallColor(n).replace('w-12 h-12', '').replace('text-xl', '').replace('border-b-4', 'border-b-2')}`}>{n}</span>)}</div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${record.mode === 'weighted' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/20' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>{record.mode === 'weighted' && <TrendingUp size={10}/>}{record.mode === 'weighted' ? 'AI' : '랜덤'}</span>
                                    <span className="font-mono opacity-70 hidden sm:inline">{record.date}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                                    <button onClick={(e) => handleCopyItem(e, record)} className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white">{copyFeedbackId === record.id ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}</button>
                                    <div className="w-px h-3 bg-white/10"></div>
                                    <button onClick={(e) => togglePin(e, record.id)} className={`p-1.5 rounded-md ${record.isPinned ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>{record.isPinned ? <Pin size={14} fill="currentColor"/> : <PinOff size={14}/>}</button>
                                    <button onClick={(e) => deleteItem(e, record.id)} className="p-1.5 hover:bg-red-900/30 rounded-md text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}