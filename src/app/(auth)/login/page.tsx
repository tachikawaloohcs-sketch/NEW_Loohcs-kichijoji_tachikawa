"use client";

import { useActionState, useEffect, useState, Suspense } from "react";
import { useFormStatus } from "react-dom";
import { authenticate, lineLogin } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, MessageCircle, ArrowRight } from "lucide-react";

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full h-11 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]" disabled={pending}>
            {pending ? (
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>ログイン中...</span>
                </div>
            ) : "ログイン"}
        </Button>
    );
}

function LoginForm() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
    const searchParams = useSearchParams();
    const isAuto = searchParams.get("auto") === "true";

    useEffect(() => {
        if (isAuto && !isAdminMode) {
            setIsAutoLoggingIn(true);
            // Use server action for LINE login
            // This triggers NextAuth's signIn("line") properly
            lineLogin().catch((error) => {
                console.error("LINE login error:", error);
                setIsAutoLoggingIn(false);
            });
        }
    }, [isAuto, isAdminMode]);

    if (isAutoLoggingIn) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#06C755]/20 border-t-[#06C755]" />
                    <MessageCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#06C755]" size={24} />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold">LINEで自動ログイン中</h3>
                    <p className="text-sm text-muted-foreground">LINEログイン画面に移動しています...</p>
                </div>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl overflow-hidden transition-all duration-500">
            <div className="h-2 w-full bg-gradient-to-r from-[#06C755] via-blue-500 to-purple-600" />
            <CardHeader className="text-center pt-8 pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <ShieldCheck className="text-primary" size={32} />
                </div>
                <CardTitle className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    Reservation
                </CardTitle>
                <CardDescription className="text-base font-medium">立川・吉祥寺校 予約システム</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8">
                {!isAdminMode ? (
                    <div className="space-y-5 py-2">
                        <Button
                            type="button"
                            className="w-full h-14 text-lg font-black bg-[#06C755] text-white hover:bg-[#05b34c] transition-all rounded-2xl shadow-[0_10px_20px_rgba(6,199,85,0.3)] hover:shadow-[0_15px_25px_rgba(6,199,85,0.4)] border-none flex items-center justify-center gap-3 group"
                            onClick={() => lineLogin()}
                        >
                            <MessageCircle fill="currentColor" size={24} />
                            <span>LINEでログイン</span>
                            <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold tracking-widest">or</span></div>
                        </div>

                        <p className="text-[11px] text-center text-slate-400 font-medium px-2 leading-relaxed">
                            PC版LINEをご利用の方は、表示されるQRコードをスマホで読み取るだけでログイン可能です。
                        </p>

                        <div className="pt-2 flex justify-center">
                            <button
                                onClick={() => setIsAdminMode(true)}
                                className="group flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-all"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                                保護者・管理者はこちら
                            </button>
                        </div>
                    </div>
                ) : (
                    <form action={dispatch} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">メールアドレス</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="admin@example.com"
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" aria-label="パスワード" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">パスワード</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        className="h-11 rounded-xl border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50 focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <LoginButton />

                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => setIsAdminMode(false)}
                                className="text-xs font-bold text-slate-400 hover:text-primary transition-all"
                            >
                                ← LINEログインに戻る
                            </button>
                        </div>
                    </form>
                )}

                {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px] text-center font-bold animate-shake">
                        {errorMessage}
                    </div>
                )}
            </CardContent>
            <div className="pb-8 px-8">
                <p className="text-[10px] text-center text-slate-400">
                    &copy; {new Date().getFullYear()} Loohcs-kichijoji_tachikawa. All rights reserved.
                </p>
            </div>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-[#06C755] rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[150px] opacity-40 animate-pulse delay-700" />
            </div>

            <Suspense fallback={
                <Card className="w-full max-w-sm h-96 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl border-none">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                </Card>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
