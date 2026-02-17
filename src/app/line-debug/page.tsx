import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function LineDebugPage() {
    const session = await auth();

    return (
        <div className="container mx-auto p-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>LINE連携デバッグ</CardTitle>
                    <CardDescription>
                        あなたのLINE内部IDを確認するためのページです。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!session ? (
                        <div className="text-center space-y-4">
                            <p>まずログインしてください（LINE連携したいアカウントで）。</p>
                            <Link href="/login">
                                <Button>ログイン画面へ</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-100 rounded-md">
                                <p className="text-sm font-bold text-slate-500">現在のログインユーザー:</p>
                                <p className="text-lg">{session.user?.name} ({session.user?.email})</p>
                            </div>

                            <div className="border-t pt-4">
                                <p className="mb-4 text-sm text-red-600 font-bold">
                                    まだIDがわからない場合は、一度ログアウトしてから「LINEでログイン」をしてください。
                                    その後、管理者画面の「ユーザー管理」を見るとIDが表示されるようになっています。
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
