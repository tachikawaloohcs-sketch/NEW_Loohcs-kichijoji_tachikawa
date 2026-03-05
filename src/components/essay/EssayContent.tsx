import { PenTool, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ESSAY_THEMES = [
    {
        id: 1,
        title: "AIとこれからの労働環境について",
        type: "一般・時事",
        duration: "60分",
        wordCount: "800字",
        status: "COMPLETED"
    },
    {
        id: 2,
        title: "「多様性」がもたらす社会の変容",
        type: "社会科学",
        duration: "90分",
        wordCount: "1200字",
        status: "ACTIVE"
    },
    {
        id: 3,
        title: "グローバル化と地域共同体のあり方",
        type: "社会科学",
        duration: "90分",
        wordCount: "1000字",
        status: "NEW"
    },
];

export default function EssayContent() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-6 animate-in fade-in duration-700">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white flex justify-center items-center gap-4">
                    <PenTool className="w-10 h-10 text-rose-500" />
                    テーマアーカイブ
                </h2>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                    論理を組み立て、言葉を磨く。
                    <br />志望校の傾向に合わせたテーマを選び、執筆と添削のサイクルを回しましょう。
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main content - Themes */}
                <div className="lg:col-span-2 space-y-6">
                    {ESSAY_THEMES.map((theme) => (
                        <Card
                            key={theme.id}
                            className={`bg-zinc-900 border-zinc-800 hover:border-rose-500/50 transition-all duration-300 group overflow-hidden ${theme.status === 'COMPLETED' ? 'opacity-70' : ''}`}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <CardHeader className="pb-3 border-b border-zinc-800/50 flex flex-row items-start justify-between">
                                <div className="space-y-1">
                                    <Badge variant="outline" className="border-rose-500/30 text-rose-400 font-mono text-[10px] tracking-widest mb-2">
                                        {theme.type}
                                    </Badge>
                                    <CardTitle className="text-xl text-white font-bold leading-tight">
                                        {theme.title}
                                    </CardTitle>
                                </div>
                                <div>
                                    {theme.status === "COMPLETED" && (
                                        <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-full">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    )}
                                    {theme.status === "NEW" && (
                                        <Badge className="bg-rose-500 text-white font-bold tracking-wider">NEW</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="py-4 text-sm text-zinc-400 flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase tracking-wider text-zinc-600 font-bold">字数</span>
                                    <span className="font-mono text-zinc-300 text-base">{theme.wordCount}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase tracking-wider text-zinc-600 font-bold">制限時間</span>
                                    <span className="font-mono text-zinc-300 text-base">{theme.duration}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-6 px-6">
                                <Button
                                    variant={theme.status === "COMPLETED" ? "secondary" : "default"}
                                    className={`w-full h-12 rounded-lg font-bold flex items-center justify-between px-6 ${theme.status === "COMPLETED"
                                        ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                        : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20"
                                        }`}
                                >
                                    {theme.status === "COMPLETED" ? "添削結果を見る" : "執筆を開始する"}
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Sidebar / Stats */}
                <div className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">あなたの軌跡</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="text-3xl font-black text-rose-400 font-mono">1</div>
                                <p className="text-xs text-zinc-400">完了したテーマ</p>
                            </div>
                            <div className="h-px w-full bg-zinc-800" />
                            <div>
                                <div className="text-3xl font-black text-white font-mono">800<span className="text-sm text-zinc-500 font-normal ml-1">字</span></div>
                                <p className="text-xs text-zinc-400">執筆の総文字数</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-14 rounded-xl border border-zinc-700/50 flex items-center justify-center gap-3">
                        <Play className="w-4 h-4 text-rose-400" />
                        書き方講義（動画）を見る
                    </Button>
                </div>
            </div>
        </div>
    );
}
