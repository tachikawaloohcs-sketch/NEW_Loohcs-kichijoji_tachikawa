"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Settings, Calendar } from "lucide-react";

export default function StudentDashboardClient({
    user,
    instructors
}: {
    user: any;
    instructors: any[];
}) {
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <div className="container mx-auto p-4 space-y-6 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#004661] to-[#006085]">
                    生徒ダッシュボード
                </h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8 p-1 bg-white/50 backdrop-blur border border-slate-200 shadow-sm rounded-xl">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-[#004661] data-[state=active]:text-white rounded-lg transition-all">
                        <UserIcon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">プロフィール</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-[#004661] data-[state=active]:text-white rounded-lg transition-all">
                        <Settings className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">設定</span>
                    </TabsTrigger>
                </TabsList>

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
