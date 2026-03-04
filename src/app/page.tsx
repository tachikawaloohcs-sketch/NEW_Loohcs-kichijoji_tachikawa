import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { SessionRefresher } from "@/components/SessionRefresher";
import { prisma } from "@/lib/prisma";

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

  const isDisabled = (target: "STUDENT" | "INSTRUCTOR" | "ADMIN" | "PARENT") => {
    if (!user) return false;
    if (role === "ADMIN") return false;
    if (role === "PARENT") return target !== "PARENT";
    if (role === "INSTRUCTOR") return target === "ADMIN" || target === "PARENT";
    if (role === "STUDENT") return target !== "STUDENT";
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4">
      {user && role && <SessionRefresher serverRole={role} />}
      <div className="max-w-5xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary dark:text-blue-400">
          Loohcs志塾立川・吉祥寺校予約システム
        </h1>

        {user ? (
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            ようこそ。{user.name}さん。
          </p>
        ) : (
          <p className="text-xl text-slate-600 dark:text-slate-400">
            ログインする役割を選択してください
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
          {/* Locus System Card */}
          <div className="">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-emerald-500 h-full bg-emerald-50/30 dark:bg-emerald-950/20">
              <CardHeader>
                <CardTitle className="text-emerald-700 dark:text-emerald-400">Locus</CardTitle>
                <CardDescription>探究・プロジェクト支援画面へ</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/locus">Locusを開く</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className={isDisabled("STUDENT") ? "opacity-50" : ""}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-primary h-full">
              <CardHeader>
                <CardTitle>生徒</CardTitle>
                <CardDescription>授業の予約・履歴確認</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={user ? "/student/dashboard" : "/login"}>生徒としてログイン</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className={isDisabled("PARENT") ? "opacity-50" : ""}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-green-500 h-full">
              <CardHeader>
                <CardTitle>保護者</CardTitle>
                <CardDescription>学習状況の確認</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href={user ? "/parent/dashboard" : "/login"}>保護者としてログイン</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className={isDisabled("INSTRUCTOR") ? "opacity-50" : ""}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-blue-500 h-full">
              <CardHeader>
                <CardTitle>講師</CardTitle>
                <CardDescription>シフト提出・授業報告</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href={user ? "/instructor/dashboard" : "/login"}>講師としてログイン</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className={isDisabled("ADMIN") ? "opacity-50 pointer-events-none" : ""}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-purple-500 h-full">
              <CardHeader>
                <CardTitle>管理者</CardTitle>
                <CardDescription>ユーザー管理・請求</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="secondary">
                  <Link href={user ? "/admin/dashboard" : "/login"}>管理者としてログイン</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
