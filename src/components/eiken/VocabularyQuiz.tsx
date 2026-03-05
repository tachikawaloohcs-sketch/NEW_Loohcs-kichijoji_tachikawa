"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, BrainCircuit, RefreshCw, Trophy, ArrowRight } from "lucide-react";

// Mock Vocabulary Data per Grade
const VOCAB_DATABASE: Record<string, { id: number; word: string; meaning: string; wrongOptions: string[] }[]> = {
    "5級": [
        { id: 101, word: "dog", meaning: "犬", wrongOptions: ["猫", "鳥", "魚"] },
        { id: 102, word: "cat", meaning: "猫", wrongOptions: ["犬", "馬", "豚"] },
        { id: 103, word: "apple", meaning: "りんご", wrongOptions: ["みかん", "ぶどう", "バナナ"] },
        { id: 104, word: "book", meaning: "本", wrongOptions: ["机", "ペン", "椅子"] },
        { id: 105, word: "water", meaning: "水", wrongOptions: ["火", "土", "風"] },
        { id: 106, word: "school", meaning: "学校", wrongOptions: ["病院", "公園", "駅"] },
        { id: 107, word: "friend", meaning: "友達", wrongOptions: ["敵", "先生", "家族"] },
    ],
    "4級": [
        { id: 201, word: "beautiful", meaning: "美しい", wrongOptions: ["醜い", "速い", "遅い"] },
        { id: 202, word: "tomorrow", meaning: "明日", wrongOptions: ["昨日", "今日", "明後日"] },
        { id: 203, word: "understand", meaning: "理解する", wrongOptions: ["忘れる", "走る", "食べる"] },
        { id: 204, word: "different", meaning: "違う、異なる", wrongOptions: ["同じ", "安全な", "危険な"] },
        { id: 205, word: "history", meaning: "歴史", wrongOptions: ["数学", "理科", "体育"] },
        { id: 206, word: "important", meaning: "重要な", wrongOptions: ["無駄な", "軽い", "短い"] },
        { id: 207, word: "language", meaning: "言語", wrongOptions: ["音楽", "絵画", "スポーツ"] },
    ],
    "3級": [
        { id: 301, word: "experience", meaning: "経験", wrongOptions: ["知識", "感情", "理由"] },
        { id: 302, word: "environment", meaning: "環境", wrongOptions: ["経済", "政治", "教育"] },
        { id: 303, word: "necessary", meaning: "必要な", wrongOptions: ["不必要な", "簡単な", "難しい"] },
        { id: 304, word: "improve", meaning: "改善する", wrongOptions: ["悪化させる", "維持する", "無視する"] },
        { id: 305, word: "society", meaning: "社会", wrongOptions: ["個人", "自然", "宇宙"] },
        { id: 306, word: "knowledge", meaning: "知識", wrongOptions: ["経験", "体力", "財産"] },
    ],
    "準2級": [
        { id: 401, word: "abandon", meaning: "捨てる、見捨てる", wrongOptions: ["保持する", "発展させる", "理解する"] },
        { id: 402, word: "absorb", meaning: "吸収する", wrongOptions: ["放出する", "分離する", "無視する"] },
        { id: 403, word: "abundant", meaning: "豊富な", wrongOptions: ["希少な", "危険な", "退屈な"] },
        { id: 404, word: "accelerate", meaning: "加速させる", wrongOptions: ["停止する", "減少する", "隠す"] },
        { id: 405, word: "accommodate", meaning: "収容する", wrongOptions: ["拒否する", "攻撃する", "逃げる"] },
        { id: 406, word: "accumulate", meaning: "蓄積する", wrongOptions: ["消費する", "分散する", "忘れる"] },
        { id: 407, word: "adequate", meaning: "適切な、十分な", wrongOptions: ["不足している", "複雑な", "古い"] },
    ],
    "2級": [
        { id: 501, word: "ambiguous", meaning: "曖昧な", wrongOptions: ["明確な", "巨大な", "親切な"] },
        { id: 502, word: "anticipate", meaning: "予期する", wrongOptions: ["後悔する", "無視する", "証明する"] },
        { id: 503, word: "apparent", meaning: "明白な", wrongOptions: ["隠された", "複雑な", "高価な"] },
        { id: 504, word: "assign", meaning: "割り当てる", wrongOptions: ["奪う", "拒絶する", "賞賛する"] },
        { id: 505, word: "artificial", meaning: "人工の", wrongOptions: ["自然の", "美しい", "壊れた"] },
    ],
    "準1級": [
        { id: 601, word: "advocate", meaning: "提唱する", wrongOptions: ["反対する", "破壊する", "隠蔽する"] },
        { id: 602, word: "consensus", meaning: "合意", wrongOptions: ["対立", "命令", "混乱"] },
        { id: 603, word: "provoke", meaning: "引き起こす、挑発する", wrongOptions: ["鎮める", "逃げる", "喜ばせる"] },
        { id: 604, word: "vulnerable", meaning: "傷つきやすい", wrongOptions: ["頑丈な", "賢い", "素早い"] },
        { id: 605, word: "lucrative", meaning: "儲かる", wrongOptions: ["損する", "退屈な", "危険な"] },
    ],
    "1級": [
        { id: 701, word: "anomalous", meaning: "変則的な、異例の", wrongOptions: ["普通の", "巨大な", "親切な"] },
        { id: 702, word: "belligerent", meaning: "好戦的な", wrongOptions: ["平和的な", "悲しい", "楽しい"] },
        { id: 703, word: "capricious", meaning: "気まぐれな", wrongOptions: ["一貫した", "重い", "軽い"] },
        { id: 704, word: "ebullient", meaning: "熱狂的な、活気あふれる", wrongOptions: ["無気力な", "慎重な", "静かな"] },
        { id: 705, word: "fastidious", meaning: "気難しい", wrongOptions: ["大雑把な", "柔軟な", "元気な"] },
    ]
};

// Utility to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

type Question = {
    wordId: number;
    word: string;
    correctAnswer: string;
    options: string[];
};

export default function VocabularyQuiz() {
    const [quizStarted, setQuizStarted] = useState(false);
    const [queue, setQueue] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    const [selectedGrade, setSelectedGrade] = useState("準2級");

    // Proficiency state (mocked from instructor setting)
    const proficiencyPercentage = 68;

    const startQuiz = () => {
        const wordsForGrade = VOCAB_DATABASE[selectedGrade] || [];
        // Select up to 10 words randomly
        const selectedWords = shuffleArray(wordsForGrade).slice(0, 10);

        const initialQueue = selectedWords.map(v => {
            const options = shuffleArray([v.meaning, ...v.wrongOptions]);
            return {
                wordId: v.id,
                word: v.word,
                correctAnswer: v.meaning,
                options
            };
        });

        setQueue(initialQueue);
        setCurrentIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsCorrect(null);
        setCompleted(false);
        setQuizStarted(true);
    };

    const handleOptionSelect = (option: string) => {
        if (selectedOption !== null) return; // Prevent multiple clicks

        setSelectedOption(option);
        const currentQ = queue[currentIndex];
        const correct = option === currentQ.correctAnswer;
        setIsCorrect(correct);

        if (correct) {
            setScore(s => s + 1);
        } else {
            // Re-queue the wrong question at the end with shuffled options
            const wordsForGrade = VOCAB_DATABASE[selectedGrade] || [];
            const originalVocab = wordsForGrade.find(v => v.id === currentQ.wordId);
            if (originalVocab) {
                const newOptions = shuffleArray([originalVocab.meaning, ...originalVocab.wrongOptions]);
                setQueue(prev => [...prev, {
                    ...currentQ,
                    options: newOptions
                }]);
            }
        }
    };

    const handleNext = () => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            setCompleted(true);
        }
    };

    if (!quizStarted) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <Card className="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border-blue-800/50 backdrop-blur shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2 text-white">
                            <BrainCircuit className="text-blue-400" />
                            英検対策 単語マスター
                        </CardTitle>
                        <CardDescription className="text-blue-200/70">
                            1回10問の4択テスト。間違えた単語は正解するまで出題されます。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Instructor set proficiency */}
                        <div className="bg-black/20 p-6 rounded-xl border border-blue-500/20">

                            {/* Grade Selection */}
                            <div className="mb-8">
                                <Label className="text-blue-200 font-bold mb-3 block">挑戦する級を選択してください</Label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(VOCAB_DATABASE).map(grade => (
                                        <button
                                            key={grade}
                                            onClick={() => setSelectedGrade(grade)}
                                            className={`py-2 px-4 rounded-lg font-bold transition-all text-sm ${selectedGrade === grade
                                                ? "bg-blue-600 text-white shadow-lg border border-blue-400"
                                                : "bg-blue-950/60 text-blue-300 border border-blue-900/50 hover:bg-blue-900 hover:text-white"
                                                }`}
                                        >
                                            {grade}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-2 pt-4 border-t border-blue-900/50">
                                <div>
                                    <p className="text-sm font-medium text-blue-400 mb-1">現在の総合習熟度</p>
                                    <h3 className="text-3xl font-black text-white">{proficiencyPercentage}% <span className="text-sm font-normal text-slate-400">/ 目標達成率</span></h3>
                                </div>
                                <Trophy className="w-8 h-8 text-yellow-500 opacity-80" />
                            </div>
                            <Progress value={proficiencyPercentage} className="h-3 bg-blue-950/50 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-emerald-400" />
                            <p className="text-xs text-blue-200/50 mt-3 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> 最新データ: 本日更新
                            </p>
                        </div>

                        <Button
                            onClick={startQuiz}
                            size="lg"
                            className="w-full h-16 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
                        >
                            テストを開始する
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (completed) {
        return (
            <Card className="bg-slate-900 border-slate-800 text-center py-12 animate-in fade-in zoom-in-95">
                <CardContent className="space-y-6">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Trophy className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">トレーニング完了！</h2>
                    <p className="text-slate-400">
                        {queue.length}問中、一発正解は {score}問でした。<br />
                        苦手な単語も反復して完璧にしました！
                    </p>
                    <Button onClick={startQuiz} className="bg-emerald-600 hover:bg-emerald-500 mt-4 rounded-xl px-8 h-12">
                        もう一度挑戦する
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const currentQ = queue[currentIndex];

    return (
        <Card className="max-w-2xl mx-auto bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4">
            {/* Progress bar at the very top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
                <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                />
            </div>

            <CardHeader className="pt-8 pb-4 text-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Question {currentIndex + 1} of {queue.length}
                </div>
                <CardTitle className="text-5xl md:text-6xl font-black text-white tracking-tight py-6">
                    {currentQ.word}
                </CardTitle>
            </CardHeader>

            <CardContent className="px-6 md:px-12 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((opt, i) => {
                        let buttonStateClass = "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200";

                        if (selectedOption !== null) {
                            if (opt === currentQ.correctAnswer) {
                                buttonStateClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400"; // Correct answer is highlighted
                            } else if (opt === selectedOption) {
                                buttonStateClass = "bg-red-500/20 border-red-500 text-red-400"; // User's wrong selection
                            } else {
                                buttonStateClass = "bg-slate-900 border-slate-800 text-slate-600 opacity-50"; // Other unselected options dim
                            }
                        }

                        return (
                            <button
                                key={i}
                                disabled={selectedOption !== null}
                                onClick={() => handleOptionSelect(opt)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ${buttonStateClass} flex items-center justify-between`}
                            >
                                <span>{opt}</span>
                                {selectedOption !== null && opt === currentQ.correctAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                {selectedOption !== null && opt === selectedOption && opt !== currentQ.correctAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                            </button>
                        );
                    })}
                </div>

                {selectedOption !== null && (
                    <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
                        <div className={`text-lg font-bold mb-4 flex items-center gap-2 ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                            {isCorrect ? (
                                <><CheckCircle2 /> 正解！</>
                            ) : (
                                <><XCircle /> 不正解... (次回また出題されます)</>
                            )}
                        </div>
                        <Button
                            onClick={handleNext}
                            className="w-full h-14 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center gap-2 group"
                        >
                            次の問題へ
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
