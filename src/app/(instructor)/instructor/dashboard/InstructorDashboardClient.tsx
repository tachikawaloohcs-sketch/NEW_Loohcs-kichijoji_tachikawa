"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CarteViewer } from "@/components/dashboard/CarteViewer";
import { createShift, submitReport, approveRequest, rejectRequest, deleteShift, updateAdmissionResult } from "./actions";

type ShiftType = "individual" | "group" | "special" | "beginner" | "trial";

interface Booking {
    id: string;
    status: string;
    student: { name: string | null };
    report: Report | null;
}

interface Shift {
    id: string;
    start: Date;
    end: Date;
    type: string;
    className?: string | null;
    location?: string; // Add location to interface
    bookings: Booking[];
}

interface Request {
    id: string;
    student: { name: string | null; email: string };
    start: Date;
    end: Date;
    status: string;
}

interface Report {
    id: string;
    content: string;
    homework: string | null;
    feedback: string | null;
    logUrl: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

interface StudentBooking {
    id: string;
    shift: {
        start: Date;
        instructor: { name: string | null };
    };
    report: Report | null;
}

interface Student {
    id: string;
    name: string | null;
    email: string;
    studentBookings: StudentBooking[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    admissionResults?: any[];
}

export default function InstructorDashboardClient({
    initialShifts,
    initialRequests,
    students,
    archivedStudents = [],
    deadlineExtensionHours = 0,
    currentUser
}: {
    initialShifts: Shift[],
    initialRequests: Request[],
    students: Student[],
    archivedStudents?: Student[],
    deadlineExtensionHours?: number,
    currentUser?: any
}) {
    const [date, setDate] = useState<Date | undefined>(new Date());

    // ... (rest of state definitions)

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [requests, setRequests] = useState<Request[]>(initialRequests);
    const [activeTab, setActiveTab] = useState("shifts");

    // Ensure dates are properly parsed from server serialization
    const currentShifts = useMemo(() => {
        return initialShifts.map(shift => ({
            ...shift,
            start: new Date(shift.start),
            end: new Date(shift.end),
            bookings: shift.bookings.map(booking => ({
                ...booking,
                report: booking.report ? {
                    ...booking.report,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    createdAt: new Date((booking.report as any).createdAt || new Date())
                } : null
            }))
        }));
    }, [initialShifts]);


    // Report Dialog State
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [reportDefaults, setReportDefaults] = useState<Report | null>(null);

    // Shift Form State
    const [startTime, setStartTime] = useState("10:00");
    const [endTime, setEndTime] = useState("11:00");
    const [shiftType, setShiftType] = useState<ShiftType>("individual");
    const [location, setLocation] = useState("ONLINE");
    const [classNameInput, setClassNameInput] = useState("");

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate) {
            setIsDialogOpen(true);
        }
    };

    const handleCreateShift = async () => {
        if (!date) return;
        const formData = new FormData();
        formData.append("date", format(date, "yyyy-MM-dd"));
        formData.append("startTime", startTime);
        formData.append("endTime", endTime);
        formData.append("type", shiftType);
        formData.append("location", location);
        if (classNameInput) formData.append("className", classNameInput);

        startTransition(async () => {
            const result = await createShift(formData);
            if (result.success) {
                setIsDialogOpen(false);
                setShiftType("individual");
                setLocation("ONLINE");
                setClassNameInput("");
            } else {
                alert(result.error);
            }
        });
    };

    const getDayShifts = (day: Date) => {
        return currentShifts.filter((s) => isSameDay(s.start, day));
    };

    const formatDate = (d: Date) => format(d, "yyyy/MM/dd HH:mm");
    const formatTime = (d: Date) => format(d, "HH:mm");

    const getLocationLabel = (loc?: string) => {
        switch (loc) {
            case 'KICHIJOJI': return '吉祥寺';
            case 'TACHIKAWA': return '立川';
            case 'ONLINE': return 'オンライン';
            default: return 'オンライン';
        }
    };

    // Filter for Today's Classes needing reports
    const todayClasses = useMemo(() => {
        const today = new Date();
        return currentShifts.filter(s =>
            isSameDay(s.start, today) &&
            s.bookings.length > 0
        );
    }, [currentShifts]);

    // Calculate dates with unsubmitted reports
    const unsubmittedDates = useMemo(() => {
        const now = new Date();
        const dates: Date[] = [];
        currentShifts.forEach(shift => {
            const shiftStart = new Date(shift.start);
            // Only consider past shifts or started shifts
            if (shiftStart < now) {
                shift.bookings.forEach(booking => {
                    if ((booking.status === "CONFIRMED" || booking.status === "confirmed") && !booking.report) {
                        // Normalize to start of day for Calendar matching
                        const d = new Date(shiftStart);
                        d.setHours(0, 0, 0, 0);
                        dates.push(d);
                    }
                });
            }
        });
        return dates;
    }, [currentShifts]);

    const openReportDialog = (bookingId: string, existingReport?: Report | null) => {
        setSelectedBookingId(bookingId);
        setReportDefaults(existingReport || null);
        setIsReportDialogOpen(true);
    };

    const handleSubmitReport = async (formData: FormData) => {
        if (!selectedBookingId) return;
        startTransition(async () => {
            const res = await submitReport(selectedBookingId, formData);
            if (res.success) {
                if (res.warning) {
                    alert(res.warning);
                } else {
                    alert("カルテを提出しました");
                }
                setIsReportDialogOpen(false);
            } else {
                alert(res.error);
            }
        });
    };

    const handleApproveRequest = async (requestId: string) => {
        if (!confirm("このリクエストを承認しますか？（シフトと予約が作成されます）")) return;
        startTransition(async () => {
            const res = await approveRequest(requestId);
            if (res.success) {
                alert("リクエストを承認しました");
                setRequests(prev => prev.filter(r => r.id !== requestId));
            } else {
                alert(res.error);
            }
        });
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!confirm("このリクエストを却下しますか？")) return;
        startTransition(async () => {
            const res = await rejectRequest(requestId);
            if (res.success) {
                alert("リクエストを却下しました");
                setRequests(prev => prev.filter(r => r.id !== requestId));
            } else {
                alert(res.error);
            }
        });
    };

    const getDeadlineText = () => {
        const deadline = new Date();
        deadline.setHours(23, 59, 0, 0);

        if (deadlineExtensionHours > 0) {
            deadline.setHours(deadline.getHours() + deadlineExtensionHours);
            return format(deadline, "M月d日 H:mm", { locale: ja }) + " までに提出してください。";
        }
        return "当日23:59までにカルテを提出してください。";
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="shifts">シフト・授業管理</TabsTrigger>
                    <TabsTrigger value="history">授業履歴</TabsTrigger>
                    <TabsTrigger value="reports">生徒カルテ閲覧</TabsTrigger>
                </TabsList>

                <TabsContent value="shifts" className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Calendar & Shift Input */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Report Alert Section for Today */}
                        {todayClasses.length > 0 && (
                            <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                                <CardHeader>
                                    <CardTitle className="text-orange-700 dark:text-orange-400">本日の授業・カルテ提出</CardTitle>
                                    <CardDescription>授業後、{getDeadlineText()}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {todayClasses.map(shift => (
                                        shift.bookings.filter(b => b.status === 'CONFIRMED').map(booking => (
                                            <div key={booking.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded shadow-sm">
                                                <div>
                                                    <div className="font-bold">
                                                        {formatTime(shift.start)} - {formatTime(shift.end)}
                                                        <Badge variant="outline" className="ml-2">{getLocationLabel(shift.location)}</Badge>
                                                    </div>
                                                    <div>生徒: {booking.student.name}</div>
                                                    {shift.className && <div className="text-xs text-muted-foreground">{shift.className}</div>}
                                                </div>
                                                {booking.report ? (
                                                    <div className="flex gap-2 items-center">
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">提出済み</Badge>
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openReportDialog(booking.id, booking.report)}>編集</Button>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" onClick={() => openReportDialog(booking.id)}>カルテを書く</Button>
                                                )}
                                            </div>
                                        ))
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>シフト管理</CardTitle>
                                <CardDescription>
                                    日付を選択してシフト時間を登録してください。「登録」を押すと即時公開されます。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={handleDateSelect}
                                        className="rounded-md border shadow mx-auto"
                                        modifiers={{ unsubmitted: unsubmittedDates }}
                                        modifiersClassNames={{
                                            unsubmitted: "bg-red-100 text-red-600 font-bold border-2 border-red-500 rounded-full"
                                        }}

                                    />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">
                                        {date ? format(date, "yyyy年M月d日", { locale: ja }) : "日付を選択"} のシフト
                                    </h3>

                                    <div className="space-y-2">
                                        {date && getDayShifts(date).length === 0 ? (
                                            <p className="text-sm text-muted-foreground">シフトは登録されていません。</p>
                                        ) : (
                                            date && getDayShifts(date).map((shift) => (
                                                <div key={shift.id} className="flex flex-col p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={shift.type === "INDIVIDUAL" ? "default" : shift.type === "GROUP" ? "secondary" : shift.type === "BEGINNER" ? "outline" : shift.type === "TRIAL" ? "default" : "destructive"}>
                                                                {shift.type === "INDIVIDUAL" ? "個別" : shift.type === "GROUP" ? "集団" : shift.type === "BEGINNER" ? "ビギナー" : shift.type === "TRIAL" ? "無料体験" : "特別"}
                                                            </Badge>
                                                            <span className="font-mono text-sm">{formatTime(shift.start)} - {formatTime(shift.end)}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{getLocationLabel(shift.location)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        {(() => {
                                                            // Find confirmed booking
                                                            const confirmedBooking = shift.bookings.find(b => b.status === 'CONFIRMED' || b.status === 'confirmed');

                                                            return (
                                                                <>
                                                                    {confirmedBooking ? (
                                                                        <span className="text-xs text-blue-600">予約あり: {confirmedBooking.student.name}</span>
                                                                    ) : (
                                                                        <span className="text-xs text-muted-foreground">予約なし</span>
                                                                    )}

                                                                    {/* Report Button / Status */}
                                                                    <div className="flex gap-2 items-center">
                                                                        {confirmedBooking && (() => {
                                                                            const hasReport = !!confirmedBooking.report;
                                                                            const isStarted = new Date(shift.start) < new Date();

                                                                            if (hasReport) {
                                                                                return (
                                                                                    <div className="flex gap-2 items-center">
                                                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">提出済み</Badge>
                                                                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openReportDialog(confirmedBooking.id, confirmedBooking.report)}>編集</Button>
                                                                                    </div>
                                                                                );
                                                                            } else if (isStarted) {
                                                                                return <Button size="sm" onClick={() => openReportDialog(confirmedBooking.id)} className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white">カルテを書く</Button>;
                                                                            }
                                                                            return null;
                                                                        })()}

                                                                        {/* Delete Button Logic - Allow if > 24h even if booked */}
                                                                        {new Date(shift.start).getTime() - new Date().getTime() > 24 * 60 * 60 * 1000 && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                                onClick={() => {
                                                                                    const hasBooking = shift.bookings.some(b => b.status === 'CONFIRMED');
                                                                                    const message = hasBooking
                                                                                        ? "このシフトには予約が入っています。\n削除すると予約もキャンセルされます。\n本当に削除しますか？"
                                                                                        : "このシフトを削除しますか？";

                                                                                    if (confirm(message)) {
                                                                                        startTransition(async () => {
                                                                                            const res = await deleteShift(shift.id);
                                                                                            if (!res.success) alert(res.error);
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                disabled={isPending}
                                                                            >
                                                                                削除
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Summary & Requests */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>今月の稼働状況</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currentShifts.length} コマ</div>
                                <p className="text-sm text-muted-foreground">登録済みシフト</p>
                            </CardContent>
                        </Card>

                        {/* Requests List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>日程リクエスト</CardTitle>
                                <CardDescription>生徒からの個別日程相談</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {requests.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">リクエストはありません</p>
                                ) : (
                                    requests.map(req => (
                                        <div key={req.id} className="p-3 border rounded bg-slate-50 dark:bg-slate-900 space-y-2">
                                            <div className="font-bold text-sm">{req.student.name}</div>
                                            <div className="text-sm">
                                                {format(req.start, "M/d HH:mm", { locale: ja })} - {format(req.end, "HH:mm")}
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleRejectRequest(req.id)} disabled={isPending}>却下</Button>
                                                <Button size="sm" onClick={() => handleApproveRequest(req.id)} disabled={isPending}>承認</Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Shift Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>シフトを追加</DialogTitle>
                                <DialogDescription>
                                    {date && format(date, "yyyy年M月d日", { locale: ja })} のシフト詳細を入力してください。
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">時間</Label>
                                    <div className="col-span-3 flex gap-2 items-center">
                                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-24" />
                                        <span>~</span>
                                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-24" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">場所</Label>
                                    <Select value={location} onValueChange={setLocation}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ONLINE">オンライン</SelectItem>
                                            <SelectItem value="KICHIJOJI">吉祥寺校舎</SelectItem>
                                            <SelectItem value="TACHIKAWA">立川校舎</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">種別</Label>
                                    <Select value={shiftType} onValueChange={(val: ShiftType) => setShiftType(val)}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">個別指導</SelectItem>
                                            <SelectItem value="group">集団授業</SelectItem>
                                            <SelectItem value="beginner">ビギナー</SelectItem>
                                            <SelectItem value="trial">無料体験</SelectItem>
                                            <SelectItem value="special">特別パック</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {shiftType !== "individual" && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">授業名</Label>
                                        <Input
                                            value={classNameInput}
                                            onChange={(e) => setClassNameInput(e.target.value)}
                                            placeholder="例: 中3英語特訓"
                                            className="col-span-3"
                                        />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
                                <Button onClick={handleCreateShift} disabled={isPending}>公開する</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Report Dialog: UPDATE HERE */}
                    <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>授業カルテの入力</DialogTitle>
                                <DialogDescription>
                                    本日の授業の報告を行ってください。
                                </DialogDescription>
                            </DialogHeader>
                            <form action={handleSubmitReport}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>本日の実施内容（所感含む正直な記録）</Label>
                                        <Textarea name="content" required placeholder="授業内容に対する生徒の様子..." className="h-24" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>該当ログURL</Label>
                                        <Input name="logUrl" placeholder="https://..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>宿題</Label>
                                        <Input name="homework" placeholder="志望理由書（2000字以上）" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>講師への連絡事項</Label>
                                        <Textarea name="feedback" placeholder="引き継ぎ事項など" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" type="button" onClick={() => setIsReportDialogOpen(false)}>キャンセル</Button>
                                    <Button type="submit" disabled={isPending}>提出する</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>授業履歴</CardTitle>
                            <CardDescription>過去の授業とカルテ提出状況</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(() => {
                                    const historyItems = currentShifts
                                        .filter(s => new Date(s.start) < new Date()) // Past shifts
                                        .flatMap(s => s.bookings.filter(b => b.status === 'CONFIRMED').map(b => ({
                                            shift: s,
                                            booking: b
                                        })))
                                        .sort((a, b) => new Date(b.shift.start).getTime() - new Date(a.shift.start).getTime()); // Descending

                                    if (historyItems.length === 0) {
                                        return <p className="text-muted-foreground">履歴はありません</p>;
                                    }

                                    return historyItems.map(({ shift, booking }) => (
                                        <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="font-mono text-lg">
                                                    {format(shift.start, "yyyy/MM/dd HH:mm")}
                                                </div>
                                                <div className="font-bold text-lg">
                                                    {booking.student.name}
                                                </div>
                                            </div>
                                            <div>
                                                {booking.report ? (
                                                    <div className="flex gap-2 items-center">
                                                        <Badge className="bg-slate-700 hover:bg-slate-800 text-white">カルテ提出済</Badge>
                                                        <Button size="sm" variant="ghost" onClick={() => openReportDialog(booking.id, booking.report)}>編集</Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="font-bold"
                                                        onClick={() => openReportDialog(booking.id)}
                                                    >
                                                        未提出
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                    <CarteViewer
                        students={students}
                        editable={true}
                        onUpdateAdmission={updateAdmissionResult}
                    />
                </TabsContent>

                <TabsContent value="archives" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>アーカイブ閲覧</CardTitle>
                            <CardDescription>
                                過去の生徒のカルテを閲覧できます（管理者により許可された生徒のみ）
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CarteViewer
                                students={archivedStudents || []}
                                editable={false}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>シフトを追加</DialogTitle>
                        <DialogDescription>
                            {date && format(date, "yyyy年M月d日", { locale: ja })} のシフト詳細を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">時間</Label>
                            <div className="col-span-3 flex gap-2 items-center">
                                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-24" />
                                <span>~</span>
                                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-24" />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">場所</Label>
                            <Select value={location} onValueChange={setLocation}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ONLINE">オンライン</SelectItem>
                                    <SelectItem value="KICHIJOJI">吉祥寺校舎</SelectItem>
                                    <SelectItem value="TACHIKAWA">立川校舎</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">種別</Label>
                            <Select value={shiftType} onValueChange={(val: ShiftType) => setShiftType(val)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">個別指導</SelectItem>
                                    <SelectItem value="group">集団授業</SelectItem>
                                    <SelectItem value="beginner">ビギナー</SelectItem>
                                    <SelectItem value="trial">無料体験</SelectItem>
                                    <SelectItem value="special">特別パック</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {shiftType !== "individual" && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">授業名</Label>
                                <Input
                                    value={classNameInput}
                                    onChange={(e) => setClassNameInput(e.target.value)}
                                    placeholder="例: 中3英語特訓"
                                    className="col-span-3"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleCreateShift} disabled={isPending}>公開する</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Report Dialog */}
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>授業カルテの入力</DialogTitle>
                        <DialogDescription>
                            本日の授業の報告を行ってください。
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleSubmitReport}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>本日の実施内容（所感含む正直な記録）</Label>
                                <Textarea name="content" required placeholder="授業内容と生徒の様子..." className="h-24" defaultValue={reportDefaults?.content || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label>該当ログURL</Label>
                                <Input name="logUrl" placeholder="https://..." defaultValue={reportDefaults?.logUrl || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label>宿題</Label>
                                <Input name="homework" placeholder="P.24-25, 単語テスト" defaultValue={reportDefaults?.homework || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label>生徒への申し送り事項</Label>
                                <Textarea name="feedback" placeholder="次回までに復習しておくこと..." defaultValue={reportDefaults?.feedback || ""} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsReportDialogOpen(false)}>キャンセル</Button>
                            <Button type="submit" disabled={isPending}>提出する</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
