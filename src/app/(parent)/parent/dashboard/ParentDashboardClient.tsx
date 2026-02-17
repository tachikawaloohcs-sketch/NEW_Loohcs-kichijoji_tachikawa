'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ChildData {
    id: string;
    name: string;
    monthlyCount: number;
    stats: Record<string, number>;
    history: any[];
    upcoming: any[];
}

export default function ParentDashboardClient({ children }: { children: ChildData[] }) {
    if (!children || children.length === 0) {
        return <div className="p-4">登録されているお子様がいません。</div>;
    }

    const [selectedChildId, setSelectedChildId] = useState(children[0].id);

    const activeChild = children.find(c => c.id === selectedChildId) || children[0];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">お子様の学習状況</h2>

            <Tabs defaultValue={children[0].id} onValueChange={setSelectedChildId} className="w-full">
                <TabsList className="mb-4">
                    {children.map(child => (
                        <TabsTrigger key={child.id} value={child.id}>
                            {child.name || '未設定'}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {children.map(child => (
                    <TabsContent key={child.id} value={child.id} className="space-y-6">
                        {/* 統計カード */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">今月の受講数</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">{child.monthlyCount}コマ</div>
                                    <p className="text-xs text-muted-foreground mt-1">今月予約済みの授業数</p>
                                </CardContent>
                            </Card>

                            <Card className="col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">授業種別ごとの予約数</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-4">
                                        {Object.entries(child.stats).map(([type, count]) => (
                                            <div key={type} className="flex flex-col items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg min-w-[100px]">
                                                <span className="text-lg font-bold">{count}</span>
                                                <span className="text-xs text-muted-foreground mt-1">{type}</span>
                                            </div>
                                        ))}
                                        {Object.keys(child.stats).length === 0 && (
                                            <div className="text-sm text-muted-foreground">データがありません</div>
                                        )}
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
                                {child.upcoming.length > 0 ? (
                                    <div className="space-y-4">
                                        {child.upcoming.map((u: any) => (
                                            <div key={u.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <div className="font-semibold">
                                                        {format(new Date(u.date), 'M月d日(E) H:mm', { locale: ja })}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {u.type} / {u.instructor}
                                                    </div>
                                                </div>
                                                <div className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">予定</div>
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
                                {child.history.length > 0 ? (
                                    <div className="space-y-4">
                                        {child.history.map((h: any) => (
                                            <div key={h.id} className="border-b pb-4 last:border-0 last:pb-0 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-semibold">
                                                            {format(new Date(h.date), 'yyyy年M月d日(E) H:mm', { locale: ja })}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {h.type} / {h.instructor}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">完了</div>
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
