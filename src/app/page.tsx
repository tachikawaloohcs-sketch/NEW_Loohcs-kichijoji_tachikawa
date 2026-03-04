import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { SessionRefresher } from "@/components/SessionRefresher";
import { prisma } from "@/lib/prisma";
import { Sparkles, ArrowRight, Beaker, GraduationCap, Users, ShieldAlert } from "lucide-react";

export default async function Home() {
  const session = await auth();
  let user = session?.user;

  // Fetch latest role directly from DB to avoid stale session issues
  let role = user?.role;
  if (user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, name: true }
    });
    if (!dbUser) {
      const { redirect } = await import("next/navigation");
      redirect("/api/force-logout");
    } else {
      role = dbUser.role;
      // Also update name for display if needed
      if (user) user.name = dbUser.name;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800 flex flex-col items-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] mix-blend-screen mix-blend-lighten pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] mix-blend-screen mix-blend-lighten pointer-events-none"></div>
      </div>

      {user && role && <SessionRefresher serverRole={role} />}

      <div className="relative z-10 max-w-5xl w-full px-6 py-20 lg:py-32 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">

        {/* Hero Title Section */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-sm font-medium mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Sparkles className="w-4 h-4" />
            <span>Loohcs Evolution System</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm font-serif">
            Locus
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            探究・プロジェクトの壁を突破し、次の次元へ。
          </p>
        </div>

        {/* User Greeting & Navigation */}
        <div className="w-full max-w-3xl space-y-8 mt-12 bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-2xl">
          {user ? (
            <div className="space-y-8">
              <p className="text-xl font-medium text-zinc-300">
                ようこそ、<span className="text-white font-bold">{user.name}</span> さん
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Locus Primary Action */}
                <div className="md:col-span-2">
                  <Button asChild className="w-full h-16 text-lg bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-300 group font-bold">
                    <Link href="/locus" className="flex items-center justify-between px-6">
                      <span className="flex items-center gap-3"><Beaker className="w-6 h-6" /> Locus を起動する</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>

                {/* Role Specific Dashboard Cards */}
                {role === "STUDENT" && (
                  <Button asChild variant="outline" className="w-full h-14 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white text-zinc-300 rounded-xl group">
                    <Link href="/student/dashboard" className="flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-blue-400" /> マイページ (予約・履歴)
                    </Link>
                  </Button>
                )}

                {role === "PARENT" && (
                  <Button asChild variant="outline" className="w-full h-14 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white text-zinc-300 rounded-xl group">
                    <Link href="/parent/dashboard" className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-green-400" /> 保護者ダッシュボード
                    </Link>
                  </Button>
                )}

                {(role === "INSTRUCTOR" || role === "ADMIN") && (
                  <Button asChild variant="outline" className="w-full h-14 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white text-zinc-300 rounded-xl group">
                    <Link href="/instructor/dashboard" className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-400" /> 講師ダッシュボード
                    </Link>
                  </Button>
                )}

                {role === "ADMIN" && (
                  <Button asChild variant="outline" className="w-full h-14 border-purple-900/50 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 rounded-xl group">
                    <Link href="/admin/dashboard" className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-400" /> 管理者コンソール
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-4">
              <p className="text-zinc-400">システムを利用するにはログインしてください</p>
              <div className="flex justify-center">
                <Button asChild size="lg" className="h-14 px-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all w-full max-w-sm font-bold text-lg">
                  <Link href="/login">ログインへ進む</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
