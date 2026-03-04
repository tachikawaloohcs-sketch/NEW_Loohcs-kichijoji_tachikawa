import VocabularyQuiz from "./VocabularyQuiz";
import { BookOpen, GraduationCap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EikenLocusPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Minimal Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild size="icon" className="hover:bg-slate-800 rounded-full h-10 w-10 text-slate-400 hover:text-white">
                        <Link href="/student/dashboard">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">
                            英検対策 Locus
                        </h1>
                    </div>
                </div>
                <div className="text-xs font-semibold px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-800/50 rounded-full flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    Student View
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <VocabularyQuiz />
            </main>
        </div>
    );
}
