'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ConsolidatedStats {
    regularCount: number;  // 個別・集団合計
    specialCount: number;  // 特別パック合計
}

interface MonthlyStats {
    currentMonth: ConsolidatedStats;
    lastMonth: ConsolidatedStats;
    twoMonthsAgo: ConsolidatedStats;
}

interface ChildData {
    id: string;
    name: string;
    monthlyCount: number;
    stats: MonthlyStats;
    history: any[];
    upcoming: any[];
}

/** 授業タイプコードを日本語に変換 */
function getTypeLabel(type: string): string {
    switch (type) {
        case 'INDIVIDUAL': return '個別指導';
        case 'GROUP': return '集団授業';
        case 'BEGINNER': return '初回体験';
        case 'TRIAL': return 'トライアル';
        case 'SPECIAL': return '特別授業';
        case 'SPECIAL_PACK': return '特別パック';
        default: return type;
    }
}

/** 場所コードを日本語に変換 */
function getLocationLabel(loc?: string): string {
    switch (loc) {
        case 'KICHIJOJI': return '吉祥寺校舎';
        case 'TACHIKAWA': return '立川校舎';
        case 'ONLINE': return 'オンライン';
        default: return 'オンライン';
    }
}

export default function ParentDashboardClient({ children }: { children: ChildData[] }) {
    if (!children || children.length === 0) {
        return <div className="p-4">登録されているお子様がいません。</div>;
    }

    const [selectedChildId, setSelectedChildId] = useState(children[0].id);
    const activeChild = children.find(c => c.id === selectedChildId) || children[0];

    if (!activeChild) return <div className="p-4">データの読み込みに失敗しました。</div>;

    const safeFormat = (date: any, formatStr: string) => {
        try {
            if (!date) return '日付不明';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '日付不明';
            return format(d, formatStr, { locale: ja });
        } catch {
            return '日付不明';
        }
    };

    const formatTimeRange = (start: any, end: any) => {
        const s = safeFormat(start, 'HH:mm');
        const e = safeFormat(end, 'HH:mm');
        return `${s} - ${e}`;
    };

    const now = new Date();
    const currentMonthLabel = format(now, "M月", { locale: ja });
    const lastMonthLabel = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), "M月", { locale: ja });
    const twoMonthsAgoLabel = format(new Date(now.getFullYear(), now.getMonth() - 2, 1), "M月", { locale: ja });

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">お子様の学習状況</h2>

            <Tabs defaultValue={children[0].id} onValueChange={setSelectedChildId} className="w-full">
                <TabsList className="mb-4 overflow-x-auto flex flex-nowrap justify-start">
                    {children.map(child => (
                        <TabsTrigger key={child.id} value={child.id} className="whitespace-nowrap">
                            {child.name || '未設定'}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {children.map(child => (
                    <TabsContent key={child.id} value={child.id} className="space-y-6">

                        {/* 統計カード */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="md:col-span-1">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">今月の受講数</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">{child.monthlyCount}コマ</div>
                                    <p className="text-xs text-muted-foreground mt-1">今月予約済みの授業数</p>
                                </CardContent>
                            </Card>

                            {/* 授業種別合計（直近3ヶ月） */}
                            <Card className="md:col-span-3">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">授業種別ごとの予約数（直近3ヶ月）</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* 2ヶ月前 */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-slate-500">{twoMonthsAgoLabel}</h4>
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex flex-col items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                    <span className="text-xl font-bold">{child.stats.twoMonthsAgo.regularCount}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 text-center">個別・集団<br />合計</span>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                    <span className="text-xl font-bold">{child.stats.twoMonthsAgo.specialCount}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 text-center">特別パック<br />合計</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 1ヶ月前 */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-slate-500">{lastMonthLabel}</h4>
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex flex-col items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                    <span className="text-xl font-bold">{child.stats.lastMonth.regularCount}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 text-center">個別・集団<br />合計</span>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                    <span className="text-xl font-bold">{child.stats.lastMonth.specialCount}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 text-center">特別パック<br />合計</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 今月 */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-slate-500">{currentMonthLabel}</h4>
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex flex-col items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                                                    <span className="text-xl font-bold">{child.stats.currentMonth.regularCount}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 text-center">個別・集団<br />合計</span>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                                                    <span className="text-xl font-bold">{child.stats.currentMonth.specialCount}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 text-center">特別パック<br />合計</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 今後の予定 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>今後の授業予定</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {child.upcoming && child.upcoming.length > 0 ? (
                                    <div className="space-y-4">
                                        {child.upcoming.map((u: any) => (
                                            <div key={u.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                                                <div className="space-y-0.5">
                                                    <div className="font-semibold">
                                                        {safeFormat(u.start, 'M月d日(E)',)} {formatTimeRange(u.start, u.end)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {getTypeLabel(u.type)} / {u.instructor}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {getLocationLabel(u.location)}
                                                    </div>
                                                </div>
                                                <div className="text-sm px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded whitespace-nowrap ml-4">予定</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">今後の予定はありません</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* 授業履歴 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>授業履歴</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {child.history && child.history.length > 0 ? (
                                    <div className="space-y-4">
                                        {child.history.map((h: any) => (
                                            <div key={h.id} className="border-b pb-4 last:border-0 last:pb-0 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-0.5">
                                                        <div className="font-semibold">
                                                            {safeFormat(h.start, 'yyyy年M月d日(E)')} {formatTimeRange(h.start, h.end)}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {getTypeLabel(h.type)} / {h.instructor}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {getLocationLabel(h.location)}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded whitespace-nowrap ml-4">完了</div>
                                                </div>
                                                {h.report && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-sm">
                                                        <p className="font-semibold text-xs text-muted-foreground mb-1">授業内容:</p>
                                                        <div className="whitespace-pre-wrap mb-2">{h.report.content}</div>
                                                        {h.report.feedback && (
                                                            <>
                                                                <p className="font-semibold text-xs text-muted-foreground mb-1">フィードバック:</p>
                                                                <div className="whitespace-pre-wrap">{h.report.feedback}</div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">履歴はありません</p>
                                )}
                            </CardContent>
                        </Card>

                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
