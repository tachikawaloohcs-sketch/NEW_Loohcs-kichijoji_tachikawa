import { getParentDashboardData } from './actions';
import ParentDashboardClient from './ParentDashboardClient';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ParentDashboardPage() {
    const session = await auth();
    if (!session || session.user.role !== 'PARENT') {
        // 保護者または管理者のみ許可
        if (session?.user.role !== 'ADMIN') {
            // redirect needed for correct role or login
        }
    }

    const { error, children } = await getParentDashboardData();

    if (error && error !== 'No children found') {
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
                <p>データを取得できませんでした: {error}</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">保護者マイページ</h1>
                    <p className="text-muted-foreground">お子様の学習状況確認</p>
                </div>
                <div className="flex gap-2">
                    <form action={logout}>
                        <Button variant="outline">ログアウト</Button>
                    </form>
                </div>
            </header>

            {children && children.length > 0 ? (
                <ParentDashboardClient children={children} />
            ) : (
                <div className="text-center p-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-lg text-muted-foreground mb-4">登録されているお子様が見つかりません。</p>
                    <p className="text-sm">管理者にお問い合わせいただき、お子様のアカウントとの連携を行ってください。</p>
                </div>
            )}
        </div>
    );
}
