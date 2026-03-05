"use client";

import React, { useState } from "react";
import {
    GitCommit, AlertTriangle, ShieldAlert, FileText,
    MessageSquare, CheckCircle2, ChevronRight, Target, FileQuestion,
    BookOpen, ExternalLink, Lightbulb, Users, ArrowRight,
    RefreshCw, Beaker, Map as MapIcon, Award, PlayCircle, ListX, BrainCircuit, Search, Video, XCircle, ArrowRightCircle, Sparkles, PenTool
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { generateRefutation } from "@/app/locus/actions";
import VocabularyQuiz from "@/components/eiken/VocabularyQuiz";
import EssayContent from "@/components/essay/EssayContent";
import { useRouter } from "next/navigation";

// ========== Mock Data ==========
const MOCK_HISTORY = [
    {
        id: "rec_1",
        classNum: 1,
        date: "2026-02-10",
        question: "地方都市のシャッター街はなぜ甦らないのか？",
        questionChanged: false,
        hypothesis: "資金不足ではなく『当事者意識を持つ地元コミュニティ』の不在が原因である。",
        evidences: ["先行研究(木下,2015): 補助金主導の地域活性化は9割が3年で補助金切れとともに終了する"],
        premises: ["コミュニティさえあればシャッター街は復活するはずだ"],
        contact: {
            type: "PREPARATION",
            target: "地元商店街の会長",
            purpose: "当事者意識が本当にないのか、それとも別の要因があるのか確認する",
            expectedRefutation: "『意識はあるが金と人がないだけだ』と言われるだろう"
        },
        redefinition: null,
        studentReflection: "思い込みで前提を置いていたことに気付かされた。やはり自分で本を読むだけじゃダメだ。",
        nextAction: "まずは事実を確認するために、市役所の地域振興課にも話を聞きに行きたい。",
        instructorComment: "【指摘】前提の『コミュニティさえあれば復活する』が強すぎる。『コミュニティ』の定義を接触で明らかにしてきてほしい。"
    },
    {
        id: "rec_2",
        classNum: 2,
        date: "2026-02-17",
        question: "地方都市のシャッター街はなぜ甦らないのか？",
        questionChanged: false,
        hypothesis: "当事者意識の不在ではなく、『リスクを取る若手への権限移譲』がなされていないことが根本原因である。",
        evidences: ["インタビュー: 商店街会長は『やりたい若い奴がいない』と嘆くが、若手は『口出しされて面倒だからやりたくない』と語った"],
        premises: ["若手に完全に権限を委譲すれば、活性化のアイデアは実行される"],
        contact: {
            type: "REFLECTION",
            feedback: "会長は資金と制度のせいにするが、若手は人間関係のせいにする。完全に認識がズレていた。",
            brokenLink: "意識がないのではなく『世代間の信頼と権限の壁』が障壁だった。",
            fixPlan: "コミュニティという曖昧な言葉を捨て、権限移譲に焦点を当てて仮説を再定義する。"
        },
        redefinition: "『当事者意識』という言葉から『世代間の権限移譲』へと仮説の解像度を上げた。",
        studentReflection: "「若手に任せる」って言葉の難しさを実感した。次は予算なのか、人事権なのか、権限の定義が必要だ。",
        nextAction: "「権限移譲」が上手くいった他の自治体の事例を論文で探す。",
        instructorComment: "【承認】現場のリアルな声によって当初の甘い前提が見事に崩れた。良い接触。次は『ではどうすれば権限移譲が起きるのか』を問う必要がある。"
    }
];

export default function LocusPreview({ userRole = "STUDENT", initialTab = "TIMELINE" }: { userRole?: string, initialTab?: "TIMELINE" | "SUBMIT" | "PAGES" | "EIKEN" | "ESSAY" }) {
    const isInstructor = userRole === "INSTRUCTOR" || userRole === "ADMIN";
    const viewMode = isInstructor ? "INSTRUCTOR" : "STUDENT";
    const [activeTab, setActiveTab] = useState<"TIMELINE" | "SUBMIT" | "PAGES" | "EIKEN" | "ESSAY">(initialTab);
    const router = useRouter();

    const [isGeneratingRefutation, setIsGeneratingRefutation] = useState(false);
    const [aiRefutations, setAiRefutations] = useState<{ title: string; content: string }[] | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    const [history, setHistory] = useState(MOCK_HISTORY);

    const handleGenerateRefutation = async (record?: any) => {
        setIsGeneratingRefutation(true);
        setAiError(null);
        try {
            // Use the passed record or defaults to the latest active record
            const targetRecord = record || history[history.length - 1];
            const response = await generateRefutation(targetRecord.hypothesis, targetRecord.premises);

            if (response.error) {
                setAiError(response.error);
            } else if (response.refutations) {
                setAiRefutations(response.refutations);
            }
        } catch (error) {
            setAiError("エラーが発生しました。時間を置いて再度お試しください。");
        } finally {
            setIsGeneratingRefutation(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-300 font-mono text-sm leading-relaxed">
            {/* Sidebar / Left Navigation */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-100 font-bold text-lg">
                        <Beaker className="w-5 h-5 text-emerald-500" />
                        Locus Lab
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Research & Evolution System</div>
                </div>

                <div className="p-4">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Active Themes</div>
                    <button className="w-full text-left px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 font-medium flex items-center justify-between group">
                        <span className="truncate">シャッター街の権限移譲</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:animate-pulse"></div>
                    </button>

                    <button className="w-full text-left px-3 py-2 mt-2 hover:bg-zinc-900/50 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                        + 新規テーマ凍結解除
                    </button>
                </div>

                <div className="p-4 mt-auto border-t border-zinc-800">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Study Materials</div>
                    <button onClick={() => setActiveTab("EIKEN")} className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${activeTab === "EIKEN" ? "bg-zinc-900 text-blue-400" : "hover:bg-zinc-900/50 text-zinc-400 hover:text-blue-400"}`}>
                        <BrainCircuit className="w-4 h-4" /> 英検 特訓ルーム
                    </button>
                    <button onClick={() => setActiveTab("ESSAY")} className={`w-full text-left px-3 py-2 mt-1 rounded transition-colors flex items-center gap-2 ${activeTab === "ESSAY" ? "bg-zinc-900 text-rose-400" : "hover:bg-zinc-900/50 text-zinc-400 hover:text-rose-400"}`}>
                        <PenTool className="w-4 h-4" /> 小論文 Locus
                    </button>
                    <Link href="/student/dashboard" className="w-full text-left px-3 py-2 mt-4 hover:bg-zinc-900/50 border border-zinc-800 rounded text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 rotate-180" /> Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header Navbar - Only visible for Research themes */}
                {(activeTab === "TIMELINE" || activeTab === "SUBMIT" || activeTab === "PAGES") && (
                    <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur flex items-center justify-between px-6 z-10 shrink-0">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setActiveTab("TIMELINE")}
                                className={`flex items-center gap-2 pb-1 border-b-2 transition-colors ${activeTab === "TIMELINE" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                            >
                                <MapIcon className="w-4 h-4" /> 構造マップ (Timeline)
                            </button>
                            <button
                                onClick={() => setActiveTab("SUBMIT")}
                                className={`flex items-center gap-2 pb-1 border-b-2 transition-colors ${activeTab === "SUBMIT" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                            >
                                <GitCommit className="w-4 h-4" /> 授業提出 (Update)
                            </button>
                            <button
                                onClick={() => setActiveTab("PAGES")}
                                className={`flex items-center gap-2 pb-1 border-b-2 transition-colors ${activeTab === "PAGES" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                            >
                                <FileText className="w-4 h-4" /> 5枚生成 (Extraction)
                            </button>
                        </div>
                    </header>
                )}

                {/* Content Grid */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Column: Dynamic Content based on Tab */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {activeTab === "TIMELINE" && <TimelineView history={history} />}
                        {activeTab === "SUBMIT" && (
                            <SubmissionForm
                                onPushRecord={(newRecord) => {
                                    const nextHistory = [...history, newRecord];
                                    setHistory(nextHistory);
                                    setActiveTab("TIMELINE");
                                    handleGenerateRefutation(newRecord);
                                }}
                                lastRecord={history[history.length - 1]}
                            />
                        )}
                        {activeTab === "PAGES" && <FivePagesGenerator history={history} />}
                        {activeTab === "EIKEN" && <VocabularyQuiz />}
                        {activeTab === "ESSAY" && <EssayContent />}
                    </div>

                    {/* Right Column: Always Display Weakness Analyzer for Research tabs */}
                    {(activeTab === "TIMELINE" || activeTab === "SUBMIT" || activeTab === "PAGES") && (
                        <aside className="w-80 border-l border-zinc-800 bg-zinc-950/80 flex flex-col hidden xl:flex shrink-0 sticky top-0">
                            <div className="p-4 border-b border-zinc-800 h-14 flex items-center">
                                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-emerald-500" />
                                    Weakness Analyzer
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                {viewMode === "STUDENT" ? (
                                    <div className="space-y-6">
                                        {/* 1. 構造的欠陥 / Flaws */}
                                        <div>
                                            <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" /> 構造的欠陥 (Flaws)
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                                                    <div className="flex items-start gap-3">
                                                        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                        <div>
                                                            <h4 className="text-zinc-200 font-medium mb-1">仮説が「未検証の前提」に依存しています</h4>
                                                            <p className="text-zinc-400 text-xs leading-relaxed">
                                                                「若手に完全に権限を委譲すれば、活性化のアイデアは実行される」は希望的観測です。『権限を渡しても動けなかったケース』への対策が準備されていません。このままでは論理が破綻します。
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. 何ができていないか / Missing Task */}
                                        <div>
                                            <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <ListX className="w-4 h-4" /> 未完了 / 次のステップ (Missing)
                                            </h4>
                                            <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                                                <ul className="space-y-3 text-xs text-zinc-400">
                                                    <li className="flex items-start gap-2">
                                                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                        <span><strong className="text-zinc-200 block">会長側のみのヒアリング</strong>若手側の証言やデータが存在しないため、片側だけの意見になっています。</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                        <span><strong className="text-zinc-200 block">概念が曖昧</strong>「権限移譲」の具体的な定義（予算なのか、人事権なのか）がされていません。</span>
                                                    </li>
                                                    <li className="flex items-start gap-2 pt-2 border-t border-zinc-800/50 text-blue-400">
                                                        <Search className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <span>→ 類似事例（成功/失敗）の先行研究を探し、仮説の解像度を上げてください。</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* AIによる反論 (AI Refutation) */}
                                        <div>
                                            <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> AIからの反論 (AI Refutation)
                                            </h4>
                                            <div className="bg-zinc-900/50 border border-emerald-900/50 rounded p-4">
                                                {aiRefutations ? (
                                                    <>
                                                        <p className="text-emerald-400 text-xs font-bold mb-3">学術論拠に基づく反証観点：</p>
                                                        <ul className="space-y-4 text-zinc-300 text-xs leading-relaxed">
                                                            {aiRefutations.map((ref, idx) => (
                                                                <li key={idx} className="flex items-start gap-3 border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                                                                    <ArrowRightCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                                    <div>
                                                                        <strong className="text-zinc-100 block mb-1.5">{ref.title}</strong>
                                                                        <span className="text-zinc-400 leading-loose">{ref.content}</span>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-4 space-y-3">
                                                        <p className="text-xs text-zinc-400">現在の仮説に対して、学術的な先行研究に基づく厳しい反証を行います。</p>

                                                        {aiError && (
                                                            <p className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded">{aiError}</p>
                                                        )}

                                                        <Button
                                                            onClick={() => handleGenerateRefutation()}
                                                            disabled={isGeneratingRefutation}
                                                            className="w-full bg-emerald-900/40 hover:bg-emerald-800 text-emerald-100 transition-colors h-10 border border-emerald-800/50 shadow-inner"
                                                        >
                                                            {isGeneratingRefutation ? (
                                                                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 反論生成中...</>
                                                            ) : (
                                                                <><BrainCircuit className="w-4 h-4 mr-2" /> 学術論文から反証を出力する</>
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-red-950/20 border border-red-900/50 rounded p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-zinc-200 font-medium mb-1">【危険度高】仮説が未検証前提に依存</h4>
                                                    <p className="text-red-400/80 text-xs mt-1">
                                                        「若手に完全に権限を委譲すれば、活性化のアイデアは実行される」は希望的観測。<br />
                                                        反証となる「若手に任せても動かなかった事例」が無い。
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-amber-950/20 border border-amber-900/50 rounded p-4">
                                            <div className="flex items-start gap-3">
                                                <GitCommit className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-zinc-200 font-medium mb-1">構造停滞: 危機的</h4>
                                                    <p className="text-amber-400/80 text-xs mt-1">
                                                        「問い」自体が2週間更新されていない。接触は再定義を生んだが、トップの問いに反映されていない。
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded p-4 mt-8">
                                            <h4 className="text-emerald-400 font-medium mb-2 text-xs uppercase tracking-widest">Instructor Tools</h4>
                                            <button className="w-full text-left text-xs p-2 bg-emerald-900/30 text-emerald-300 rounded hover:bg-emerald-900/50 transition">
                                                + コメント付きで再定義を要求する
                                            </button>
                                            <button className="w-full text-left text-xs p-2 mt-2 bg-zinc-900 text-zinc-400 rounded hover:bg-zinc-800 transition">
                                                + 外部接触のやり直しを指示
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    )}
                </div>
            </main>
        </div>
    );
}

// ========== Components ==========

function TimelineView({ history }: { history: any[] }) {
    return (
        <div className="max-w-3xl mx-auto pb-24">
            <h2 className="text-2xl font-bold text-zinc-100 mb-8 flex items-center gap-3">
                <MapIcon className="w-6 h-6 text-emerald-500" />
                Evolution History
            </h2>

            <div className="relative border-l-2 border-zinc-800 ml-4 space-y-12">
                {history.map((record, index) => (
                    <div key={record.id} className="relative pl-8">
                        {/* Node Marker */}
                        <div className="absolute w-4 h-4 bg-zinc-950 border-2 border-emerald-500 rounded-full -left-[9px] top-1"></div>

                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-950/50 px-2 py-1 rounded">Class {record.classNum}</span>
                            <span className="text-xs text-zinc-500">{record.date}</span>
                        </div>

                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-5 space-y-4">
                            {/* 1. 問い */}
                            <div className="border-b border-zinc-800 pb-4">
                                <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold mb-2">
                                    <FileQuestion className="w-4 h-4 text-emerald-400" />
                                    <span>問い (Question)</span>
                                </div>
                                <div className="text-zinc-200 text-base">{record.question}</div>
                            </div>

                            {/* 2. 仮説と前提 */}
                            <div className="border-b border-zinc-800 pb-4">
                                <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold mb-2">
                                    <Lightbulb className="w-4 h-4 text-amber-400" />
                                    <span>仮説 (Hypothesis)</span>
                                </div>
                                <div className="text-zinc-200">{record.hypothesis}</div>

                                <div className="mt-3 pl-4 border-l-2 border-zinc-800/50 space-y-2">
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-1">根拠:</span>
                                        {record.evidences.map((e: string, i: number) => (
                                            <div key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                                                <BookOpen className="w-3 h-3 mt-0.5 shrink-0" /> {e}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-1">未検証前提:</span>
                                        {record.premises.map((p: string, i: number) => (
                                            <div key={i} className="text-xs text-red-400/70 flex items-start gap-2">
                                                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. 外部接触 */}
                            <div className="border-b border-zinc-800 pb-4">
                                <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold mb-2">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span>外部接触 ({record.contact.type === "PREPARATION" ? "準備" : "振り返り"})</span>
                                </div>

                                {record.contact.type === "PREPARATION" ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/50 p-3 rounded">
                                        <div>
                                            <span className="text-xs text-zinc-500 block">ターゲット:</span>
                                            <span className="text-zinc-300 text-sm">{record.contact.target}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-zinc-500 block">目的:</span>
                                            <span className="text-zinc-300 text-sm">{record.contact.purpose}</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="text-xs text-zinc-500 block">想定反論:</span>
                                            <span className="text-zinc-300 text-sm">{record.contact.expectedRefutation}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-blue-950/10 border border-blue-900/30 p-3 rounded space-y-2">
                                        <div>
                                            <span className="text-xs text-blue-500/70 block">得られた気づき (Feedback):</span>
                                            <span className="text-zinc-300 text-sm">{record.contact.feedback}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-red-500/70 block">崩れた要素 (Broken):</span>
                                            <span className="text-red-200 text-sm">{record.contact.brokenLink}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. 再定義 */}
                            {record.redefinition && (
                                <div className="border-b border-zinc-800 pb-4">
                                    <div className="flex items-center gap-2 text-xs text-emerald-500 font-semibold mb-2">
                                        <RefreshCw className="w-4 h-4" />
                                        <span>再定義 (Redefinition)</span>
                                    </div>
                                    <div className="text-emerald-100/90 text-sm p-3 bg-emerald-950/20 border border-emerald-900/30 rounded">
                                        {record.redefinition}
                                    </div>
                                </div>
                            )}

                            {/* 5. 振り返りと次なる一歩 */}
                            <div className="border-b border-zinc-800 pb-4 bg-zinc-950/30 p-4 rounded mt-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold mb-2">
                                            <PenTool className="w-4 h-4" />
                                            <span>生徒の振り返り (Reflection)</span>
                                        </div>
                                        <p className="text-zinc-300 text-sm italic">「{record.studentReflection}」</p>
                                    </div>
                                    <div className="w-[1px] bg-zinc-800 self-stretch hidden md:block"></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-2">
                                            <ArrowRightCircle className="w-4 h-4" />
                                            <span>次回アクション (Next Step)</span>
                                        </div>
                                        <p className="text-zinc-300 text-sm">「{record.nextAction}」</p>
                                    </div>
                                </div>
                            </div>

                            {/* Instructor Comment */}
                            {record.instructorComment && (
                                <div className="pt-2">
                                    <div className="relative">
                                        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-zinc-700/50 rounded-full"></div>
                                        <span className="text-xs font-bold text-zinc-500 mb-1 block">Instructor Note:</span>
                                        <p className="text-zinc-400 text-sm italic">{record.instructorComment}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                ))}

                {/* Future Node placeholder */}
                <div className="relative pl-8 opacity-40">
                    <div className="absolute w-4 h-4 bg-zinc-950 border-2 border-zinc-800 border-dashed rounded-full -left-[9px] top-1"></div>
                    <div className="text-xs font-bold text-zinc-600 mb-2">Next Class ...</div>
                </div>
            </div>
        </div>
    );
}

function SubmissionForm({ onPushRecord, lastRecord }: { onPushRecord: (rec: any) => void; lastRecord: any }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contactType, setContactType] = useState("PREPARATION");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = new FormData(e.currentTarget);

        const newRecord = {
            id: `rec_${Date.now()}`,
            classNum: lastRecord.classNum + 1,
            date: format(new Date(), "yyyy-MM-dd"),
            question: form.get("question") as string,
            questionChanged: form.get("q_changed") === "on",
            hypothesis: form.get("hypothesis") as string,
            evidences: [(form.get("evidence") as string) || "未入力"],
            premises: [(form.get("premise") as string) || "未入力"],
            contact: {
                type: contactType,
                target: form.get("target"),
                purpose: form.get("purpose"),
                expectedRefutation: form.get("expectedRefutation"),
                feedback: form.get("feedback"),
                brokenLink: form.get("brokenLink"),
                fixPlan: null
            },
            redefinition: form.get("redefinition") as string || null,
            studentReflection: form.get("studentReflection") as string,
            nextAction: form.get("nextAction") as string,
            instructorComment: null
        };

        setTimeout(() => {
            setIsSubmitting(false);
            onPushRecord(newRecord);
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto pb-24">
            <h2 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-3">
                <GitCommit className="w-6 h-6 text-emerald-500" />
                Class Update Submission (レコード更新)
            </h2>
            <p className="text-zinc-500 text-xs mb-8">※ 1回の授業で必ず1つのレコードをコミットします。</p>

            <div className="space-y-8">

                {/* 1. 今の問い */}
                <fieldset className="border border-zinc-800 bg-zinc-900/30 rounded-lg p-6">
                    <legend className="px-2 text-xs font-bold text-emerald-500 bg-zinc-950 border border-zinc-800 rounded mb-4">
                        Step 1: 今の問い (Question Node)
                    </legend>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-zinc-400">現在の問い</Label>
                            <Input name="question" defaultValue={lastRecord.question} className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <input type="checkbox" name="q_changed" id="q_changed" className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500" />
                            <label htmlFor="q_changed">前回から問いを変更した</label>
                        </div>
                    </div>
                </fieldset>

                {/* 2. 今の仮説 */}
                <fieldset className="border border-zinc-800 bg-zinc-900/30 rounded-lg p-6">
                    <legend className="px-2 text-xs font-bold text-amber-500 bg-zinc-950 border border-zinc-800 rounded mb-4">
                        Step 2: 今の仮説 (Hypothesis Node)
                    </legend>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-zinc-400">仮説 (1〜3行)</Label>
                            <Textarea name="hypothesis" required rows={2} className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100" placeholder="この問いに対する現時点での答え..." />
                        </div>
                        <div>
                            <Label className="text-zinc-400">その根拠 (最低1つ)</Label>
                            <Input name="evidence" required className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono text-xs" placeholder="先行研究, インタビュー結果, データなど" />
                        </div>
                        <div>
                            <Label className="text-zinc-400 flex items-center gap-2">
                                未検証前提 (最低1つ) <ShieldAlert className="w-3 h-3 text-red-500" />
                            </Label>
                            <Input name="premise" required className="mt-1 bg-zinc-950 border-red-900/50 text-zinc-100 font-mono text-xs" placeholder="この仮説が成立するために「本当か？」と疑うべき前提" />
                        </div>
                    </div>
                </fieldset>

                {/* 3. 外部接触 */}
                <fieldset className="border border-zinc-800 bg-zinc-900/30 rounded-lg p-6">
                    <legend className="px-2 text-xs font-bold text-blue-500 bg-zinc-950 border border-zinc-800 rounded mb-4">
                        Step 3: 外部接触 (Collision Node)
                    </legend>

                    <Tabs value={contactType === "PREPARATION" ? "prep" : "refle"} onValueChange={(v) => setContactType(v === "prep" ? "PREPARATION" : "REFLECTION")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-950 border border-zinc-800 mb-6">
                            <TabsTrigger value="prep" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500">A. 接触準備</TabsTrigger>
                            <TabsTrigger value="refle" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500">B. 接触振り返り</TabsTrigger>
                        </TabsList>

                        <TabsContent value="prep" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-zinc-400">誰に (Target)</Label>
                                    <Input name="target" className="bg-zinc-950 border-zinc-800" />
                                </div>
                                <div>
                                    <Label className="text-zinc-400">何を確かめるか (Purpose)</Label>
                                    <Input name="purpose" className="bg-zinc-950 border-zinc-800" />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-zinc-400">想定反論 (Expected Refutation)</Label>
                                    <Textarea name="expectedRefutation" rows={2} className="bg-zinc-950 border-zinc-800" placeholder="相手からこう否定されるだろう..." />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="refle" className="space-y-4">
                            <div>
                                <Label className="text-zinc-400">何を言われたか (Feedback)</Label>
                                <Textarea name="feedback" rows={2} className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div>
                                <Label className="text-red-400 text-xs">何が崩れたか (Broken Frame)</Label>
                                <Input name="brokenLink" className="bg-zinc-950 border-red-900/30 text-zinc-100" />
                            </div>
                        </TabsContent>
                    </Tabs>
                </fieldset>

                {/* 4. 再定義 */}
                <fieldset className="border border-emerald-900/30 bg-emerald-950/10 rounded-lg p-6">
                    <legend className="px-2 text-xs font-bold text-emerald-400 bg-zinc-950 border border-emerald-900/30 rounded mb-4">
                        Step 4: 再定義 (Redefinition)
                    </legend>
                    <div>
                        <Label className="text-emerald-400/80 text-xs">(※あれば) 外部接触を経て、仮説や問いはどう進化したか？</Label>
                        <Textarea name="redefinition" rows={3} className="mt-1 bg-zinc-950 border-emerald-900/50 text-emerald-100 placeholder:text-zinc-700" placeholder="曖昧だった〇〇という概念を棄却し、△△に焦点を絞ることにした。" />
                    </div>
                </fieldset>

                {/* 5. 振り返りと次回アクション */}
                <fieldset className="border border-zinc-800 bg-zinc-900/30 rounded-lg p-6">
                    <legend className="px-2 text-xs font-bold text-zinc-200 bg-zinc-950 border border-zinc-800 rounded mb-4">
                        Step 5: 振り返り / 次回アクション (Reflection & Next Steps)
                    </legend>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-zinc-400 flex items-center gap-2">
                                <PenTool className="w-4 h-4" /> 本日の授業の振り返り (気づき、反省点など)
                            </Label>
                            <Textarea name="studentReflection" required rows={2} className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100" placeholder="自分の思考のクセや、やってみてわかったことなど" />
                        </div>
                        <div>
                            <Label className="text-zinc-400 flex items-center gap-2">
                                <ArrowRightCircle className="w-4 h-4 text-emerald-500" /> 次回の授業までに何をするか？ (行動計画)
                            </Label>
                            <Input name="nextAction" required className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100" placeholder="例：〇〇の論文を読む。〇〇さんにインタビューのアポを取る" />
                        </div>
                    </div>
                </fieldset>

                <div className="pt-4 flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isSubmitting ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 送信中...</>
                        ) : (
                            "Commit Update (送信)"
                        )}
                    </Button>
                </div>

            </div>
        </form>
    );
}

function FivePagesGenerator({ history }: { history: any[] }) {
    return (
        <div className="max-w-4xl mx-auto pb-24">
            <h2 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-500" />
                5 Pages Generator (軌跡の抽出)
            </h2>
            <p className="text-zinc-500 text-xs mb-8">※ 授業更新レコードを時系列に抽出して自動配置します。AIは整形のみを行い、内容は捏造しません。</p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {[
                    { id: 1, label: "問いの進化史" },
                    { id: 2, label: "現状＋外部接触" },
                    { id: 3, label: "仮説と再定義" },
                    { id: 4, label: "方法計画" },
                    { id: 5, label: "意義と今後" }
                ].map(page => (
                    <div key={page.id} className="bg-zinc-900 border border-zinc-800 rounded p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-950/20 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                            {page.id}
                        </div>
                        <span className="text-xs text-center text-zinc-300 font-medium">{page.label}</span>
                    </div>
                ))}
            </div>

            {/* Generated Preview (Mock of Page 1 & 3) */}
            <div className="space-y-8">
                <div className="bg-zinc-100 text-zinc-900 p-8 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] font-serif max-w-2xl mx-auto">
                    <h3 className="text-lg font-bold border-b border-zinc-300 pb-2 mb-4">1. 問いの進化史</h3>
                    <div className="space-y-6 text-sm">
                        <p>
                            本研究の初期の問いは「地方都市のシャッター街はなぜ甦らないのか？」であった（2026/02/10 レコード参照）。
                            当初は資金面での問題ではなく、当事者意識を持つ地元コミュニティの不在が原因であると想定していた。
                        </p>
                        <p>
                            しかし、商店街会長へのインタビューを通じた外部接触において、「組織内の世代間の信頼と権限の壁」が真の障壁となっている事実が判明した。
                            「当事者意識」という曖昧な評価を棄却し、現在は「世代間の権限移譲はいかにして発生するか？」という、より解像度の高い問いへと進化している（2026/02/17 レコードより抽出）。
                        </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-zinc-300/50 text-xs text-zinc-500 font-mono">
                        Generated by Locus System - Direct Extraction Mode
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button variant="outline" className="border-emerald-500 text-emerald-500 hover:bg-emerald-950">
                        <BookOpen className="w-4 h-4 mr-2" />
                        PDF Export (All Pages)
                    </Button>
                </div>
            </div>

            {/* Connections */}
            <div className="mt-16 border-t border-zinc-800 pt-8">
                <h3 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-500" />
                    大学受験への接続 (Integration)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded text-sm">
                        <span className="text-emerald-400 font-bold mb-2 block">◆ 面接 (Interview)</span>
                        <p className="text-zinc-400 text-xs">質問ノードに蓄積された「再定義の経緯」がそのまま「なぜそのテーマなのか」の深みのある回答素材となります。</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded text-sm">
                        <span className="text-emerald-400 font-bold mb-2 block">◆ 小論文 (Essay)</span>
                        <p className="text-zinc-400 text-xs">論文の主張は「仮説ノード」と強制リンク。根拠ノードがないとシステムが警告を発し、論理破綻を防ぎます。</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded text-sm">
                        <span className="text-emerald-400 font-bold mb-2 block">◆ 英語 (English)</span>
                        <p className="text-zinc-400 text-xs">構造化されたマップを基に、意味のねじれがない英部要約を自動生成出力します。</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
