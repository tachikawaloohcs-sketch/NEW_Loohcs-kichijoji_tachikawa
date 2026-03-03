"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, Settings, Archive } from "lucide-react";
import { CarteViewer } from "@/components/dashboard/CarteViewer";

export default function InstructorDashboardClient({
    user,
    allStudents,
    initialDeadlineExtension,
    licensedArchivedStudents
}: {
    user: any;
    allStudents: any[];
    initialDeadlineExtension: number;
    licensedArchivedStudents: any[];
}) {
    const [activeTab, setActiveTab] = useState("cartes");

    return (
        <div className="container mx-auto p-4 space-y-6 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#004661] to-[#006085]">
                    講師ダッシュボード
                </h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8 p-1 bg-white/50 backdrop-blur border border-slate-200 shadow-sm rounded-xl">
                    <TabsTrigger value="cartes" className="data-[state=active]:bg-[#004661] data-[state=active]:text-white rounded-lg transition-all">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">担当生徒カルテ</span>
                    </TabsTrigger>
                    <TabsTrigger value="archives" className="data-[state=active]:bg-[#004661] data-[state=active]:text-white rounded-lg transition-all">
                        <Archive className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">アーカイブ閲覧</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="cartes" className="space-y-4">
                    <CarteViewer students={allStudents} allInstructors={[]} role="INSTRUCTOR" loggedInUserId={user.id} />
                </TabsContent>

                <TabsContent value="archives">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-[#004661] mb-4">アーカイブ生徒</h2>
                        <CarteViewer students={licensedArchivedStudents} allInstructors={[]} role="INSTRUCTOR" loggedInUserId={user.id} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
