import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { RefreshCw, History, Info, Sparkles, Trash2, TrendingUp, BarChart3, ChevronDown, ChevronUp, Layers, Minus, Plus, X, BarChart2, AlertTriangle, ExternalLink, CheckCircle2, ArrowUpRight, Repeat, Zap, Award, Copy, Check, Pin, PinOff } from 'lucide-react';

/**
 * 로또 공 색상 결정 함수 (한국 로또 기준)
 */
const getBallColor = (num) => {
  if (num <= 10) return 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-400/50';
  if (num <= 20) return 'bg-blue-500 text-white border-blue-600 shadow-blue-500/50';
  if (num <= 30) return 'bg-red-500 text-white border-red-600 shadow-red-500/50';
  if (num <= 40) return 'bg-gray-500 text-white border-gray-600 shadow-gray-500/50';
  return 'bg-green-500 text-white border-green-600 shadow-green-500/50';
};

// 동행복권 누적 당첨 횟수 (1199회 기준)
const REAL_HISTORY_STATS = [
  { number: 1, frequency: 195 }, { number: 2, frequency: 184 }, { number: 3, frequency: 198 },
  { number: 4, frequency: 192 }, { number: 5, frequency: 175 }, { number: 6, frequency: 195 },
  { number: 7, frequency: 198 }, { number: 8, frequency: 177 }, { number: 9, frequency: 156 },
  { number: 10, frequency: 184 }, { number: 11, frequency: 188 }, { number: 12, frequency: 203 },
  { number: 13, frequency: 201 }, { number: 14, frequency: 191 }, { number: 15, frequency: 187 },
  { number: 16, frequency: 192 }, { number: 17, frequency: 199 }, { number: 18, frequency: 190 },
  { number: 19, frequency: 187 }, { number: 20, frequency: 194 }, { number: 21, frequency: 188 },
  { number: 22, frequency: 160 }, { number: 23, frequency: 164 }, { number: 24, frequency: 193 },
  { number: 25, frequency: 169 }, { number: 26, frequency: 193 }, { number: 27, frequency: 202 },
  { number: 28, frequency: 175 }, { number: 29, frequency: 168 }, { number: 30, frequency: 186 },
  { number: 31, frequency: 192 }, { number: 32, frequency: 175 }, { number: 33, frequency: 202 },
  { number: 34, frequency: 204 }, { number: 35, frequency: 187 }, { number: 36, frequency: 183 },
  { number: 37, frequency: 194 }, { number: 38, frequency: 194 }, { number: 39, frequency: 187 },
  { number: 40, frequency: 192 }, { number: 41, frequency: 162 }, { number: 42, frequency: 176 },
  { number: 43, frequency: 197 }, { number: 44, frequency: 182 }, { number: 45, frequency: 189 }
];

// 최근 30회 실제 당첨번호 데이터
const PAST_WINNING_NUMBERS = [
    { round: 1199, date: '2025.11.22', numbers: [16, 24, 25, 30, 31, 32], bonus: 7, isReal: true },
    { round: 1198, date: '2025.11.15', numbers: [26, 30, 33, 38, 39, 41], bonus: 21, isReal: true },
    { round: 1197, date: '2025.11.08', numbers: [1, 5, 7, 26, 28, 43], bonus: 30, isReal: true },
    { round: 1196, date: '2025.11.01', numbers: [8, 12, 15, 29, 40, 45], bonus: 14, isReal: true },
    { round: 1195, date: '2025.10.25', numbers: [3, 15, 27, 33, 34, 36], bonus: 37, isReal: true },
    { round: 1194, date: '2025.10.18', numbers: [3, 13, 15, 24, 33, 37], bonus: 2, isReal: true },
    { round: 1193, date: '2025.10.11', numbers: [6, 9, 16, 19, 24, 28], bonus: 17, isReal: true },
    { round: 1192, date: '2025.10.04', numbers: [10, 16, 23, 36, 39, 40], bonus: 11, isReal: true },
    { round: 1191, date: '2025.09.27', numbers: [1, 4, 11, 12, 20, 41], bonus: 2, isReal: true },
    { round: 1190, date: '2025.09.20', numbers: [7, 9, 19, 23, 26, 45], bonus: 33, isReal: true }, 
    { round: 1189, date: '2025.09.13', numbers: [9, 19, 29, 35, 37, 38], bonus: 4, isReal: true }, 
    { round: 1188, date: '2025.09.06', numbers: [3, 4, 12, 19, 22, 27], bonus: 43, isReal: true }, 
    { round: 1187, date: '2025.08.30', numbers: [5, 13, 26, 29, 37, 40], bonus: 42, isReal: true },
    { round: 1186, date: '2025.08.23', numbers: [2, 8, 13, 16, 23, 28], bonus: 31, isReal: true }, 
    { round: 1185, date: '2025.08.16', numbers: [6, 17, 22, 28, 29, 32], bonus: 15, isReal: true }, 
    { round: 1184, date: '2025.08.09', numbers: [14, 16, 23, 25, 31, 37], bonus: 9, isReal: true }, 
    { round: 1183, date: '2025.08.02', numbers: [4, 15, 17, 23, 27, 36], bonus: 13, isReal: true },
    { round: 1182, date: '2025.07.26', numbers: [1, 13, 21, 25, 28, 31], bonus: 22, isReal: true },
    { round: 1181, date: '2025.07.19', numbers: [8, 10, 14, 20, 33, 41], bonus: 25, isReal: true }, 
    { round: 1180, date: '2025.07.12', numbers: [6, 12, 18, 37, 40, 41], bonus: 3, isReal: true },
    { round: 1179, date: '2025.07.05', numbers: [3, 16, 18, 24, 40, 44], bonus: 21, isReal: true },
    { round: 1178, date: '2025.06.28', numbers: [2, 15, 21, 27, 34, 42], bonus: 8, isReal: true }, 
    { round: 1177, date: '2025.06.21', numbers: [7, 11, 12, 21, 26, 35], bonus: 6, isReal: true }, 
    { round: 1176, date: '2025.06.14', numbers: [7, 9, 11, 21, 30, 35], bonus: 29, isReal: true },
    { round: 1175, date: '2025.06.07', numbers: [3, 4, 6, 8, 32, 42], bonus: 31, isReal: true },
    { round: 1174, date: '2025.05.31', numbers: [8, 11, 14, 17, 36, 39], bonus: 22, isReal: true },
    { round: 1173, date: '2025.05.24', numbers: [1, 5, 18, 20, 30, 35], bonus: 3, isReal: true },
    { round: 1172, date: '2025.05.17', numbers: [7, 9, 24, 40, 42, 44], bonus: 45, isReal: true },
    { round: 1171, date: '2025.05.10', numbers: [3, 6, 7, 11, 12, 17], bonus: 19, isReal: true },
    { round: 1170, date: '2025.05.03', numbers: [3, 13, 28, 34, 38, 42], bonus: 25, isReal: true },
];

const checkRepeat = (currentRoundNums, prevRoundNums) => {
    if (!prevRoundNums) return [];
    return currentRoundNums.filter(num => prevRoundNums.includes(num));
};

const LottoBall = ({ number, index, isNew, isFadingOut, size = "large", isRepeat = false }) => {
  if (!number) return null;
  
  const sizeClasses = size === "small" 
    ? "w-6 h-6 sm:w-7 sm:h-7 text-xs border-b-2" 
    : "w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl border-b-4";

  return (
    <div className="relative group">
        <div
        className={`
            ${sizeClasses} rounded-full flex items-center justify-center 
            font-bold transform transition-all duration-300 flex-shrink-0
            ${getBallColor(number)}
            ${isNew && !isFadingOut ? 'scale-0 opacity-0 animate-pop-in' : ''}
            ${isFadingOut ? 'scale-50 opacity-0 translate-y-10' : 'scale-100 opacity-100'}
            ${isRepeat ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-slate-800 z-10' : ''}
        `}
        style={{
            animationDelay: isNew ? `${index * 0.1}s` : '0s',
            transitionDelay: isFadingOut ? `${index * 0.05}s` : '0s',
            animationFillMode: 'forwards'
        }}
        >
        <span className="drop-shadow-md">{number}</span>
        {size !== "small" && (
            <div className="absolute top-1 left-2 w-3 h-2 bg-white/40 rounded-full blur-[1px]"></div>
        )}
        </div>
        {isRepeat && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-lg animate-bounce z-20 flex items-center gap-0.5">
                <ArrowUpRight size={8} strokeWidth={3} />
                {size !== "small" && <span>이월</span>}
            </div>
        )}
    </div>
  );
};

export default function App() {
  const [numbers, setNumbers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]); // { ...record, isPinned: boolean }
  const [mode, setMode] = useState('weighted');
  const [showInfo, setShowInfo] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [currentRound, setCurrentRound] = useState(0); 
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsTab, setStatsTab] = useState('history');
  
  // 복사 상태 관리
  const [copyFeedbackId, setCopyFeedbackId] = useState(null);
  const [globalCopyFeedback, setGlobalCopyFeedback] = useState(false);

  // MAX HISTORY Constant
  const MAX_HISTORY = 30;

  // 핀 된 개수 및 남은 공간 계산
  const pinnedCount = useMemo(() => history.filter(h => h.isPinned).length, [history]);
  const availableSlots = Math.max(0, MAX_HISTORY - pinnedCount);
  
  // 생성 가능한 최대 횟수
  const maxRepeatCount = Math.max(0, MAX_HISTORY - pinnedCount);

  // repeatCount가 maxRepeatCount를 초과하지 않도록 조정
  useEffect(() => {
    if (repeatCount > maxRepeatCount && maxRepeatCount > 0) {
        setRepeatCount(maxRepeatCount);
    } else if (maxRepeatCount === 0 && repeatCount > 0) {
        setRepeatCount(0); // 0이면 생성 불가 상태
    } else if (repeatCount === 0 && maxRepeatCount > 0) {
        setRepeatCount(1);
    }
  }, [maxRepeatCount, repeatCount]);

  // 복사 기능
  const copyToClipboard = (text, id = null) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      if (id) {
        setCopyFeedbackId(id);
        setTimeout(() => setCopyFeedbackId(null), 2000);
      } else {
        setGlobalCopyFeedback(true);
        setTimeout(() => setGlobalCopyFeedback(false), 2000);
      }
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleCopyAll = (e) => {
    e.stopPropagation();
    const allText = history.map(record => record.nums.join(', ')).join('\n');
    copyToClipboard(allText);
  };

  const handleCopyItem = (e, record) => {
    e.stopPropagation();
    const text = record.nums.join(', ');
    copyToClipboard(text, record.id);
  };

  // 핀 토글 핸들러
  const togglePin = (e, id) => {
      e.stopPropagation();
      setHistory(prev => prev.map(item => 
          item.id === id ? { ...item, isPinned: !item.isPinned } : item
      ));
  };

  // 전체 핀 설정 핸들러
  const pinAll = (e) => {
      e.stopPropagation();
      setHistory(prev => prev.map(item => ({ ...item, isPinned: true })));
  };

  // 전체 핀 해제 핸들러
  const unpinAll = (e) => {
      e.stopPropagation();
      setHistory(prev => prev.map(item => ({ ...item, isPinned: false })));
  };

  // 개별 삭제 핸들러
  const deleteItem = (e, id) => {
      e.stopPropagation();
      setHistory(prev => prev.filter(item => item.id !== id));
  };

  // 전체 삭제 (핀 된 것 제외)
  const clearHistory = () => {
      setHistory(prev => prev.filter(item => item.isPinned));
  };

  // 통계 계산 유틸
  const calculateMean = (data, key = 'frequency') => data.reduce((acc, curr) => acc + curr[key], 0) / data.length;
  const calculateStdDev = (data, mean, key = 'frequency') => {
    const squareDiffs = data.map(item => Math.pow(item[key] - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((acc, curr) => acc + curr, 0) / data.length;
    return Math.sqrt(avgSquareDiff);
  };
  const normalCDF = (x) => 0.5 * (1 + Math.tanh(x * 0.7978845608 * (1 + 0.044715 * x * x)));

  const { sectionStats, repeatProbability, currentRepeatStreak } = useMemo(() => {
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

    let totalRepeats = 0;
    let roundsWithRepeats = 0;
    let streak = 0;

    const hasRepeat = (idx) => {
        if (idx >= PAST_WINNING_NUMBERS.length - 1) return false;
        const curr = PAST_WINNING_NUMBERS[idx].numbers;
        const prev = PAST_WINNING_NUMBERS[idx+1].numbers;
        return curr.some(n => prev.includes(n));
    };

    const isLastRoundRepeat = hasRepeat(0);
    if (isLastRoundRepeat) {
        streak = 1;
        for (let i = 1; i < PAST_WINNING_NUMBERS.length - 1; i++) {
            if (hasRepeat(i)) streak++;
            else break;
        }
    } else {
        streak = -1;
        for (let i = 1; i < PAST_WINNING_NUMBERS.length - 1; i++) {
            if (!hasRepeat(i)) streak--;
            else break;
        }
    }

    PAST_WINNING_NUMBERS.forEach((round, idx) => {
        round.numbers.forEach(num => {
            const index = Math.floor((num - 1) / 5);
            if (stats[index]) stats[index].count += 1;
        });

        if (idx < PAST_WINNING_NUMBERS.length - 1) {
            const prevRound = PAST_WINNING_NUMBERS[idx + 1];
            const repeats = checkRepeat(round.numbers, prevRound.numbers);
            if (repeats.length > 0) {
                totalRepeats += repeats.length;
                roundsWithRepeats += 1;
            }
        }
    });

    const repeatProb = roundsWithRepeats / (PAST_WINNING_NUMBERS.length - 1);

    return { sectionStats: stats, repeatProbability: repeatProb, currentRepeatStreak: streak };
  }, []);

  const allNumberWeights = useMemo(() => {
    const numMean = calculateMean(REAL_HISTORY_STATS);
    const numStdDev = calculateStdDev(REAL_HISTORY_STATS, numMean);

    const secMean = calculateMean(sectionStats, 'count');
    const secStdDev = calculateStdDev(sectionStats, secMean, 'count');

    const lastRoundNumbers = PAST_WINNING_NUMBERS[0].numbers;

    return REAL_HISTORY_STATS.map(stat => {
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
        if (lastRoundNumbers.includes(stat.number)) {
            isRepeatCandidate = true;
            let baseMultiplier = 1.0 + repeatProbability;
            if (currentRepeatStreak > 0) {
                const penalty = Math.min(0.8, currentRepeatStreak * 0.2);
                repeatMultiplier = Math.max(0.5, baseMultiplier - penalty);
            } else if (currentRepeatStreak < 0) {
                const boost = Math.abs(currentRepeatStreak) * 0.2;
                repeatMultiplier = baseMultiplier + boost;
            } else {
                repeatMultiplier = baseMultiplier;
            }
        }

        const finalWeightFactor = baseWeightFactor * sectionMultiplier * repeatMultiplier;
        const weight = Math.max(1, Math.floor(finalWeightFactor * 100));

        return {
            number: stat.number,
            weight: weight,
            isRepeatCandidate,
            baseScore: (baseWeightFactor * 100).toFixed(1),
            sectionScore: (sectionMultiplier).toFixed(2),
            repeatScore: (repeatMultiplier).toFixed(2)
        };
    });
  }, [sectionStats, repeatProbability, currentRepeatStreak]);

  const getWeightedRandomNumber = useCallback((excludeList) => {
    let weightedPool = [];
    allNumberWeights.forEach(item => {
        if (excludeList.includes(item.number)) return;
        for (let i = 0; i < item.weight; i++) {
            weightedPool.push(item.number);
        }
    });
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
  }, [allNumberWeights]);

  const generateLotto = useCallback(async () => {
    if (maxRepeatCount <= 0) return;
    if (isGenerating) return;
    setIsGenerating(true);
    setCurrentRound(0);
    
    if (repeatCount > 1) setShowHistoryList(true);

    for (let round = 1; round <= repeatCount; round++) {
      setCurrentRound(round);
      setIsFadingOut(false);
      setNumbers([]);

      const currentSet = [];
      
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        let pickedNum;
        if (mode === 'weighted') {
          pickedNum = getWeightedRandomNumber(currentSet);
        } else {
          do {
            pickedNum = Math.floor(Math.random() * 45) + 1;
          } while (currentSet.includes(pickedNum));
        }
        currentSet.push(pickedNum);
        setNumbers([...currentSet]);
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      const sortedSet = [...currentSet].sort((a, b) => a - b);
      setNumbers(sortedSet);

      await new Promise(resolve => setTimeout(resolve, 800));

      setIsFadingOut(true);
      await new Promise(resolve => setTimeout(resolve, 400));

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
          
          const availableSpaceForUnpinned = MAX_HISTORY - pinnedItems.length - 1; 
          
          const keptUnpinnedItems = unpinnedItems.slice(0, availableSpaceForUnpinned);
          
          return [newRecord, ...pinnedItems, ...keptUnpinnedItems].sort((a, b) => b.id - a.id);
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setNumbers([]);
    setIsFadingOut(false);
    setIsGenerating(false);
    setCurrentRound(0);

  }, [isGenerating, mode, repeatCount, getWeightedRandomNumber, maxRepeatCount]);

  const increaseRepeat = () => setRepeatCount(prev => Math.min(prev + 1, maxRepeatCount > 0 ? Math.min(10, maxRepeatCount) : 0));
  const decreaseRepeat = () => setRepeatCount(prev => Math.max(prev - 1, 1));

  const maxWeight = Math.max(...allNumberWeights.map(w => w.weight));
  const topRecommended = [...allNumberWeights].sort((a, b) => b.weight - a.weight).slice(0, 7).map(i => i.number);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans overflow-x-hidden pb-20">
      
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); max-height: 0; margin-bottom: 0; }
          to { opacity: 1; transform: translateY(0) scale(1); max-height: 100px; margin-bottom: 0.75rem; }
        }
        .animate-slide-down {
          animation: slide-down 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          overflow: hidden;
        }
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes modal-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-scale {
          animation: modal-scale 0.2s ease-out forwards;
        }
      `}</style>

      {/* 통계 모달 */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowStats(false)}>
          <div 
            className="bg-slate-800 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-modal-scale overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-slate-700 flex flex-col lg:flex-row items-center justify-between bg-slate-900/50 gap-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="text-pink-400" />
                <div>
                    <h2 className="text-xl font-bold text-white">동행복권 분석 데이터</h2>
                    <p className="text-xs text-slate-400">1199회 기준 정밀 분석</p>
                </div>
              </div>
              
              <div className="flex bg-slate-900/80 rounded-lg p-1 overflow-x-auto max-w-full no-scrollbar">
                <button 
                    onClick={() => setStatsTab('history')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${statsTab === 'history' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    최근 30회 당첨결과
                </button>
                <button 
                    onClick={() => setStatsTab('weights')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${statsTab === 'weights' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    <Award size={14}/> 실시간 AI 가중치
                </button>
                <button 
                    onClick={() => setStatsTab('section')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${statsTab === 'section' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    구간별(HOT/COLD)
                </button>
                <button 
                    onClick={() => setStatsTab('number')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${statsTab === 'number' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    번호별 통계
                </button>
              </div>

              <button onClick={() => setShowStats(false)} className="absolute top-4 right-4 lg:static text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              {statsTab === 'history' && (
                <div className="space-y-4">
                    <div className="mb-4 bg-indigo-900/30 border border-indigo-500/30 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-start gap-2 flex-1">
                            <Info className="text-indigo-400 flex-shrink-0 mt-0.5" size={16} />
                            <div className="text-xs text-indigo-200/80">
                                <strong>최신 1199회</strong>까지의 실제 당첨 데이터가 탑재되어 있습니다.<br/>
                                <span className="text-red-300 font-bold">빨간색 화살표(⤴)</span>는 직전 회차에서 다시 나온 <strong>이월수</strong>를 의미합니다.
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-3 text-center">회차</th>
                                    <th className="p-3 text-center">당첨번호 (이월수 표시)</th>
                                    <th className="p-3 text-center">보너스</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {PAST_WINNING_NUMBERS.map((row, index) => {
                                    const prevRound = PAST_WINNING_NUMBERS[index + 1];
                                    const repeatNums = prevRound ? checkRepeat(row.numbers, prevRound.numbers) : [];
                                    return (
                                        <tr key={row.round} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${row.isReal ? '' : 'opacity-70'}`}>
                                            <td className="p-3 text-center">
                                                <span className="font-bold text-pink-300 block">{row.round}회</span>
                                                <span className="text-[10px] text-slate-500">{row.date}</span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1 justify-center flex-wrap">
                                                    {row.numbers.map((n) => {
                                                        const isRepeat = repeatNums.includes(n);
                                                        return (
                                                            <LottoBall key={n} number={n} size="small" isRepeat={isRepeat} />
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-3 flex justify-center">
                                                <LottoBall number={row.bonus} size="small" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}

              {statsTab === 'weights' && (
                  <div className="space-y-4">
                      <div className="bg-pink-900/20 border border-pink-500/30 p-4 rounded-xl flex items-start gap-3">
                          <Zap className="text-pink-400 flex-shrink-0 mt-1" size={18} />
                          <div className="text-xs text-pink-200/90 leading-relaxed">
                              <h3 className="font-bold text-sm text-pink-300 mb-1">AI 추천 가중치 (5x9 Grid)</h3>
                              <p>점수가 높을수록 이번 회차 추천 확률이 높습니다. <span className="text-yellow-300 font-bold">TOP 7</span> 번호는 강조됩니다.</p>
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
                                      {isTop && (
                                          <div className="absolute -top-2 -right-1 bg-yellow-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm z-20">TOP</div>
                                      )}
                                      {item.isRepeatCandidate && (
                                          <div className="absolute top-1 left-1" title="이월수 후보">
                                              <Repeat size={10} className="text-red-400 drop-shadow-md" />
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
                                          <span className="text-xs text-slate-400">최근 30주간 출현 횟수</span>
                                      </div>
                                      <span className="text-2xl font-bold">{sec.count}회</span>
                                  </div>
                                  <div className="w-full h-4 bg-slate-700/50 rounded-full overflow-hidden">
                                      <div 
                                          className={`h-full rounded-full ${sec.barColor} transition-all duration-1000`}
                                          style={{ width: `${(sec.count / 30) * 100 * 1.5}%` }} // 시각적 조정을 위해 비율 1.5배
                                      ></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {statsTab === 'number' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {REAL_HISTORY_STATS.map((stat) => (
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
                                    <div className="h-full rounded-full bg-slate-400" style={{ width: `${(stat.frequency / 204) * 100}%` }}></div>
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
        
        {/* 헤더 */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Sparkles className="text-yellow-400 w-6 h-6" />
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-500">
              Lotto Master AI
            </h1>
          </div>
          <p className="text-slate-400 text-sm mb-4">번호별 + 구간별 + 이월수 동적 분석</p>
          <button 
            onClick={() => { setShowStats(true); setStatsTab('history'); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-full transition-colors border border-slate-700"
          >
            <BarChart2 size={16} className="text-pink-400"/>
            동행복권 최신 데이터 보기
          </button>
        </header>

        {/* 메인 추첨 카드 */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-6 z-10 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl"></div>

          {/* 컨트롤 영역 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 relative z-20 bg-black/20 p-4 rounded-2xl border border-white/5">
            {/* 모드 선택 */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mode</span>
                <div className="bg-black/40 p-1 rounded-full flex text-xs sm:text-sm">
                <button
                    onClick={() => setMode('random')}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 rounded-full transition-all ${mode === 'random' ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 hover:text-white'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    랜덤
                </button>
                <button
                    onClick={() => setMode('weighted')}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${mode === 'weighted' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    AI 분석
                    <Info size={12} className="cursor-help" onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}/>
                </button>
                </div>
            </div>

            {/* 반복 횟수 설정 */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Layers size={12}/> 반복 횟수
                    </span>
                    <span className="text-[10px] text-slate-500">
                        {maxRepeatCount > 0 ? `최대 ${maxRepeatCount}회 가능` : '생성 불가'}
                    </span>
                </div>
                <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                    <button 
                        onClick={decreaseRepeat}
                        disabled={isGenerating || repeatCount <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 active:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
                    >
                        <Minus size={14} />
                    </button>
                    <div className="w-10 text-center font-bold text-lg text-pink-300 tabular-nums">
                        {repeatCount}
                    </div>
                    <button 
                        onClick={increaseRepeat}
                        disabled={isGenerating || repeatCount >= maxRepeatCount}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 active:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
          </div>

          {/* 설명 툴팁 */}
          {showInfo && (
            <div className="mb-6 bg-indigo-900/90 p-4 rounded-xl text-xs text-indigo-100 border border-indigo-500/30 animate-fade-in shadow-xl z-20 relative">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-yellow-300">
                <BarChart3 size={14}/> 3단계 가중치 알고리즘
              </h3>
              <ul className="list-disc pl-4 space-y-2 text-indigo-200 opacity-90">
                <li>
                    <strong>개별 번호 (평균 회귀):</strong> 전체 통계상 덜 나온 번호 선호
                </li>
                <li>
                    <strong>구간 분석 (U-Shape):</strong> 최근 30회 핫/콜드 구간 선호
                </li>
                <li className="flex items-start gap-1">
                    <div className="flex-shrink-0 mt-0.5"><Zap size={12} className="text-orange-400"/></div>
                    <div>
                        <strong>이월수 (Streak 반영):</strong> 연속 출현시 확률 <span className="text-red-300">감소(▼)</span>, 연속 미출현시 확률 <span className="text-blue-300">증가(▲)</span>
                    </div>
                </li>
              </ul>
            </div>
          )}

          {/* 공이 표시되는 영역 */}
          <div className="h-28 sm:h-36 flex items-center justify-center gap-2 sm:gap-3 mb-6 relative">
            {numbers.length === 0 && !isGenerating ? (
              <div className="text-slate-500 text-center animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-700 flex items-center justify-center mb-2">
                    <span className="text-2xl opacity-50">?</span>
                </div>
                <p className="text-xs sm:text-sm">행운의 번호를 생성해보세요</p>
              </div>
            ) : (
              numbers.map((num, idx) => (
                <LottoBall 
                    key={`${idx}-${num}`} 
                    number={num} 
                    index={idx} 
                    isNew={true} 
                    isFadingOut={isFadingOut} 
                />
              ))
            )}
            
            {/* 진행 상황 표시 */}
            {isGenerating && repeatCount > 1 && (
                <div className="absolute -top-2 right-0 bg-yellow-500/20 text-yellow-200 text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30">
                    진행중: {currentRound} / {repeatCount}
                </div>
            )}
          </div>

          {/* 버튼 */}
          <button
            onClick={generateLotto}
            disabled={isGenerating || maxRepeatCount === 0}
            className={`
              w-full py-4 rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
              ${isGenerating 
                ? 'bg-slate-700 cursor-wait text-slate-400' 
                : maxRepeatCount === 0 
                    ? 'bg-red-900/50 cursor-not-allowed text-red-200 border border-red-500/30'
                    : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-400 hover:via-orange-400 hover:to-pink-400 text-white shadow-orange-500/30 border border-white/20'
              }
            `}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin" /> 
                {repeatCount > 1 ? `${currentRound}/${repeatCount} 회차 생성 중...` : '번호 추첨 중...'}
              </>
            ) : maxRepeatCount === 0 ? (
                <>
                    <AlertTriangle size={20} /> 보관함이 가득 찼습니다. 이력을 삭제하세요.
                </>
            ) : (
              <>
                <Sparkles /> {repeatCount > 1 ? `${repeatCount}회 자동 생성 시작` : '번호 생성하기'}
              </>
            )}
          </button>
        </div>

        {/* 히스토리 토글 버튼 */}
        <button 
            onClick={() => setShowHistoryList(!showHistoryList)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-all mb-4"
        >
            <History size={18} />
            <span>
                {history.length > 0 ? `생성 이력 확인 (${history.length}/${MAX_HISTORY})` : '생성 이력'}
            </span>
            {showHistoryList ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>

        {/* 히스토리 영역 */}
        {showHistoryList && (
            <div className="animate-fade-in pb-10">
                {history.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                         <div className="text-xs text-slate-400">
                             <span className="text-pink-300 font-bold">{pinnedCount}</span>개 고정됨 / <span className="text-slate-300">{MAX_HISTORY - history.length}</span>자리 남음
                         </div>
                         <div className="flex gap-2 flex-wrap justify-end">
                            <button 
                                onClick={pinAll}
                                disabled={isGenerating || history.length === 0}
                                className="text-xs bg-slate-800 hover:bg-yellow-900/30 text-slate-400 hover:text-yellow-400 border border-slate-700 hover:border-yellow-900/50 rounded-lg flex items-center gap-1 transition-colors px-3 py-1.5 disabled:opacity-30"
                            >
                                <Pin size={12} /> 전체 고정
                            </button>
                            <button 
                                onClick={unpinAll}
                                disabled={isGenerating || pinnedCount === 0}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg flex items-center gap-1 transition-colors px-3 py-1.5 disabled:opacity-30"
                            >
                                <PinOff size={12} /> 전체 해제
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                            <button 
                                onClick={handleCopyAll}
                                disabled={isGenerating}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1 transition-colors px-3 py-1.5 disabled:opacity-30"
                            >
                                {globalCopyFeedback ? <Check size={12} className="text-green-400"/> : <Copy size={12} />} 
                                전체 복사
                            </button>
                            <button 
                                onClick={clearHistory}
                                disabled={isGenerating}
                                className="text-xs bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900/50 rounded-lg flex items-center gap-1 transition-colors px-3 py-1.5 disabled:opacity-30"
                            >
                                <Trash2 size={12} /> 전체 삭제
                            </button>
                         </div>
                    </div>
                )}

                <div className="space-y-0">
                    {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 bg-white/5 rounded-xl border border-white/5 border-dashed">
                        생성된 이력이 없습니다.
                    </div>
                    ) : (
                    history.map((record, index) => (
                        <div 
                            key={record.id} 
                            className={`
                                bg-white/5 border rounded-xl p-3 sm:p-4 
                                flex flex-col sm:flex-row items-center justify-between gap-3 
                                transition-all duration-300 mb-3
                                ${record.isNew ? 'animate-slide-down' : ''}
                                ${record.isPinned ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10 hover:bg-white/10'}
                            `}
                        >
                            <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs text-slate-400 font-mono">
                                {history.length - index}
                            </div>
                            
                            <div className="flex gap-2">
                                {record.nums.map((n, i) => (
                                <span 
                                    key={`${record.id}-${i}`} 
                                    className={`
                                    w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md
                                    ${getBallColor(n).replace('w-12 h-12', '').replace('text-xl', '').replace('border-b-4', 'border-b-2')}
                                    `}
                                >
                                    {n}
                                </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${record.mode === 'weighted' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/20' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                                    {record.mode === 'weighted' && <TrendingUp size={10} />}
                                    {record.mode === 'weighted' ? 'AI' : '랜덤'}
                                    </span>
                                    <span className="font-mono opacity-70 hidden sm:inline">{record.date}</span>
                                </div>
                                
                                {/* 액션 버튼 그룹 */}
                                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                                    <button 
                                        onClick={(e) => handleCopyItem(e, record)}
                                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                                        title="복사"
                                    >
                                        {copyFeedbackId === record.id ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                                    </button>
                                    <div className="w-px h-3 bg-white/10"></div>
                                    <button 
                                        onClick={(e) => togglePin(e, record.id)}
                                        className={`p-1.5 rounded-md transition-colors ${record.isPinned ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                        title={record.isPinned ? "고정 해제" : "고정"}
                                    >
                                        {record.isPinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
                                    </button>
                                    <button 
                                        onClick={(e) => deleteItem(e, record.id)}
                                        className="p-1.5 hover:bg-red-900/30 rounded-md transition-colors text-slate-400 hover:text-red-400"
                                        title="삭제"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}