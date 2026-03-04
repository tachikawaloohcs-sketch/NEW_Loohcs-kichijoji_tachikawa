"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Settings, BookOpen, BrainCircuit, PenTool } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentDashboardClient({
    user,
    instructors
}: {
    user: any;
    instructors: any[];
}) {
    const [activeTab, setActiveTab] = useState("materials");

    return (
        <div className="container mx-auto p-4 space-y-6 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#004661] to-[#006085]">
                    生徒ダッシュボード
                </h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-8 p-1 bg-white/50 backdrop-blur border border-slate-200 shadow-sm rounded-xl">
                    <TabsTrigger value="materials" className="data-[state=active]:bg-[#004661] data-[state=active]:text-white rounded-lg transition-all">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">学習教材</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="data-[state=active]:bg-[#004661] data-[state=active]:text-white rounded-lg transition-all">
                        <UserIcon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">プロフィール</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-[#004661] data-[state=active]:text-white rounded-lg transition-all">
                        <Settings className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">設定</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="materials" className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="hover:shadow-lg transition-all border-blue-200 bg-gradient-to-br from-blue-50 to-white group">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-blue-800 text-2xl font-bold">
                                    <BrainCircuit className="w-6 h-6 text-blue-600" />
                                    英検対策 特訓
                                </CardTitle>
                                <CardDescription className="text-blue-700/70">
                                    講師設定のレベルに合わせた単語テストや進捗管理
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md h-12 text-md font-bold group-hover:-translate-y-0.5 transition-transform">
                                    <Link href="/student/eiken">英検ルームへ入る</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all border-rose-200 bg-gradient-to-br from-rose-50 to-white group">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-rose-800 text-2xl font-bold">
                                    <PenTool className="w-6 h-6 text-rose-600" />
                                    小論文 Locus
                                </CardTitle>
                                <CardDescription className="text-rose-700/70">
                                    テーマ別の構成訓練や過去問題の執筆・添削
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md h-12 text-md font-bold group-hover:-translate-y-0.5 transition-transform">
                                    <Link href="/student/essay">執筆ルームへ入る</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-[#004661] mb-4">プロフィール設定</h2>
                        <p className="text-slate-500">プロフィール機能は準備中です。</p>
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-[#004661] mb-4">アカウント設定</h2>
                        <p className="text-slate-500">設定画面は準備中です。</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
