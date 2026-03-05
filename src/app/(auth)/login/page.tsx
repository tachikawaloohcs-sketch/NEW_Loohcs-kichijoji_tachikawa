"use client";

import { useActionState, useState, Suspense } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full h-11 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]" disabled={pending}>
            {pending ? "ログイン中..." : "ログインする"}
        </Button>
    );
}

function LoginForm() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Card className="w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl overflow-hidden transition-all duration-500">
            <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600" />
            <CardHeader className="text-center pt-8 pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <ShieldCheck className="text-primary" size={32} />
                </div>
                <CardTitle className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-blue-500">
                    Locus
                </CardTitle>
                <CardDescription className="text-base font-medium">ログインして続ける</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8">
                <form action={dispatch} className="space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">メールアドレス</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                placeholder="mail@example.com"
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

                    <div className="pt-4 flex flex-col items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500">初めてご利用の方はこちらから登録してください。</p>
                        <Button asChild variant="outline" className="w-full rounded-xl border-dashed">
                            <Link href="/register">新規アカウント登録</Link>
                        </Button>
                    </div>
                </form>

                {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px] text-center font-bold animate-shake">
                        {errorMessage}
                    </div>
                )}
            </CardContent>
            <div className="pb-6 px-8">
                <p className="text-[10px] text-center text-slate-400">
                    &copy; {new Date().getFullYear()} Loohcs-kichijoji_tachikawa.
                </p>
            </div>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[150px] opacity-40 animate-pulse delay-700" />
            </div>

            <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
