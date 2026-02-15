"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate, lineLogin } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" aria-disabled={pending}>
            {pending ? "ログイン中..." : "ログイン"}
        </Button>
    );
}

export default function LoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);

    return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950">
            <Card className="w-full max-w-sm shadow-2xl border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">Loohcs 予約システム</CardTitle>
                    <CardDescription>立川・吉祥寺校へようこそ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!isAdminMode ? (
                        <div className="space-y-4 py-4">
                            <Button
                                type="button"
                                className="w-full h-12 text-lg font-bold bg-[#06C755] text-white hover:bg-[#05b34c] transition-all rounded-xl shadow-lg hover:shadow-[#06C755]/20 border-none"
                                onClick={() => lineLogin()}
                            >
                                LINEでログイン
                            </Button>
                            <p className="text-xs text-center text-muted-foreground px-4">
                                ログインすると利用規約およびプライバシーポリシーに同意したことになります。
                            </p>

                            <div className="pt-4 flex justify-center">
                                <button
                                    onClick={() => setIsAdminMode(true)}
                                    className="text-xs text-slate-400 hover:text-primary transition-colors hover:underline"
                                >
                                    管理者ログインはこちら
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form action={dispatch} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-2 text-center pb-2">
                                <h3 className="font-semibold text-sm">管理者ログイン</h3>
                                <p className="text-xs text-muted-foreground">管理者用メールアドレスでログインしてください</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-slate-500">メールアドレス</Label>
                                <Input id="email" type="email" name="email" required placeholder="admin@example.com" className="bg-slate-50/50 dark:bg-slate-950/50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" aria-label="パスワード" className="text-xs font-medium uppercase tracking-wider text-slate-500">パスワード</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        className="bg-slate-50/50 dark:bg-slate-950/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <LoginButton />

                            <div className="pt-2 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setIsAdminMode(false)}
                                    className="text-xs text-slate-400 hover:text-primary transition-colors hover:underline"
                                >
                                    ← LINEログインに戻る
                                </button>
                            </div>
                        </form>
                    )}

                    {errorMessage && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center font-medium animate-shake">
                            {errorMessage}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
