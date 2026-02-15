"use client";

import { useActionState, useEffect, useState } from "react";
import { completeProfile } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
    id: string;
    name: string | null;
    role: string;
    bio?: string | null;
}

export default function SetupProfileClient({ user }: { user: User }) {
    const [state, action, isPending] = useActionState(completeProfile, undefined);
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState(user.role || "STUDENT");

    useEffect(() => {
        if (state === "success") {
            router.refresh();
            // Give a small delay for session update
            setTimeout(() => {
                if (selectedRole === "ADMIN") router.push("/admin/dashboard");
                else if (selectedRole === "INSTRUCTOR") router.push("/instructor/dashboard");
                else router.push("/student/dashboard");
            }, 500);
        }
    }, [state, selectedRole, router]);

    return (
        <Card className="max-w-md w-full shadow-2xl border-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
            <CardHeader className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight text-primary">アカウント設定</CardTitle>
                <CardDescription className="text-base">
                    予約システムを利用するために、プロフィールを完成させましょう。
                </CardDescription>
            </CardHeader>
            <form action={action}>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">あなたの役割</Label>
                        <Tabs defaultValue={selectedRole} onValueChange={(v) => setSelectedRole(v)} className="w-full">
                            <TabsList className="grid grid-cols-2 w-full h-11">
                                <TabsTrigger value="STUDENT" className="text-sm">生徒として利用</TabsTrigger>
                                <TabsTrigger value="INSTRUCTOR" className="text-sm">講師として利用</TabsTrigger>
                            </TabsList>
                            <input type="hidden" name="role" value={selectedRole} />
                        </Tabs>
                        <p className="text-xs text-muted-foreground text-center">
                            {selectedRole === "STUDENT" ? "授業の予約が可能になります。" : "シフトの登録や授業報告が可能になります。"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-semibold">表示名</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={user.name || ""}
                            placeholder="例: 山田 太郎"
                            className="h-11 rounded-lg border-slate-200"
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">WEBサイト上で他のユーザーに表示される名前です。本名を推奨します。</p>
                    </div>

                    {selectedRole === "INSTRUCTOR" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="bio" className="text-base font-semibold">自己紹介・担当科目</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                defaultValue={user.bio || ""}
                                placeholder="例: 東大文二所属。英語と数学を担当しています。論理的な思考を一緒に身につけていきましょう。"
                                className="min-h-[140px] resize-none rounded-lg border-slate-200 p-3"
                            />
                        </div>
                    )}

                    {state && state !== "success" && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive font-medium text-center">{state}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="pt-2">
                    <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]" disabled={isPending}>
                        {isPending ? "保存中..." : "設定を完了する"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
