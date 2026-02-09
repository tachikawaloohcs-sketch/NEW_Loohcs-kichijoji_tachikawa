"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDetailedShifts, createBooking, createRequest } from "./actions";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface User {
    id: string;
    name: string | null;
    email: string;
    bio: string | null;
    imageUrl: string | null;
}

interface Shift {
    id: string;
    start: Date;
    end: Date;
    type: string;
    className?: string | null;
    location?: string;
}

interface Booking {
    id: string;
    shift: {
        start: Date;
        end: Date;
        type: string;
        className?: string | null;
        instructor: { name: string | null };
    };
    meetingType?: string;
}

export default function StudentDashboardClient({ instructors, initialBookings }: { instructors: User[], initialBookings: Booking[] }) {
    const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loadingShifts, setLoadingShifts] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Booking Dialog
    const [selectedShiftForBooking, setSelectedShiftForBooking] = useState<Shift | null>(null);
    const [meetingType, setMeetingType] = useState("ONLINE"); // "ONLINE", "IN_PERSON"

    // Request Dialog
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [requestInstructorId, setRequestInstructorId] = useState<string>("");
    const [requestDate, setRequestDate] = useState<Date | undefined>(new Date());
    const [requestTime, setRequestTime] = useState("10:00");
    const [isRequesting, setIsRequesting] = useState(false);

    const [requestLocation, setRequestLocation] = useState<string>("ONLINE");
    const [requestType, setRequestType] = useState<string>("INDIVIDUAL");
    const [requestEndTime, setRequestEndTime] = useState("11:00");

    // Auto-calculate end time based on type and start time
    // Special: 2 hours (default, editable)
    // Group: 2 hours (fixed)
    // Individual: 1 hour (default)
    useEffect(() => {
        if (!requestTime) return;
        const [h, m] = requestTime.split(':').map(Number);

        let duration = 1;
        if (requestType === 'SPECIAL' || requestType === 'GROUP') {
            duration = 2;
        }

        let endH = h + duration;
        let endM = m;

        // Simple overflow handling (24h)
        if (endH >= 24) endH -= 24;

        const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        setRequestEndTime(newEndTime);
    }, [requestTime, requestType]);

    const handleCreateRequest = async () => {
        if (!requestInstructorId || !requestDate || !requestTime) {
            alert("講師、日付、時間をすべて選択してください");
            return;
        }

        setIsRequesting(true);
        const res = await createRequest(requestInstructorId, requestDate, requestTime, requestEndTime, requestLocation, requestType);
        setIsRequesting(false);

        if (res.success) {
            alert("リクエストを送信しました！");
            setIsRequestDialogOpen(false);
        } else {
            alert(res.error || "リクエスト送信に失敗しました");
        }
    };

    const handleSelectInstructor = async (instructor: User) => {
        setSelectedInstructor(instructor);
        setLoadingShifts(true);
        const fetchedShifts = await getDetailedShifts(instructor.id);
        setShifts(fetchedShifts);
        setLoadingShifts(false);
    };

    const getShiftsForDate = (d: Date | undefined) => {
        if (!d) return [];
        return shifts.filter(
            (s) =>
                s.start.getDate() === d.getDate() &&
                s.start.getMonth() === d.getMonth() &&
                s.start.getFullYear() === d.getFullYear()
        );
    };

    const openBookingDialog = (shift: Shift) => {
        setSelectedShiftForBooking(shift);
        if (shift.location === 'ONLINE') {
            setMeetingType("ONLINE");
        } else {
            setMeetingType("IN_PERSON");
        }
    };

    const handleBooking = () => {
        if (!selectedShiftForBooking) return;

        startTransition(async () => {
            const res = await createBooking(selectedShiftForBooking.id, meetingType);
            if (res.success) {
                alert("予約が完了しました！");
                setSelectedShiftForBooking(null);
                if (selectedInstructor) handleSelectInstructor(selectedInstructor);
            } else {
                alert(res.error);
            }
        });
    };

    const formatTime = (d: Date) => format(d, "HH:mm");
    const formatDate = (d: Date) => format(d, "yyyy/MM/dd");

    const getLocationLabel = (loc?: string) => {
        switch (loc) {
            case 'KICHIJOJI': return '吉祥寺校舎';
            case 'TACHIKAWA': return '立川校舎';
            case 'ONLINE': return 'オンライン（推奨）';
            default: return 'オンライン（推奨）';
        }
    };

    return (
        <Tabs defaultValue="booking" className="space-y-4">
            <TabsList>
                <TabsTrigger value="booking">予約する</TabsTrigger>
                <TabsTrigger value="history">予約履歴</TabsTrigger>
            </TabsList>

            <TabsContent value="booking" className="space-y-6">
                {selectedInstructor ? (
                    <div className="space-y-6">
                        <Button variant="ghost" onClick={() => setSelectedInstructor(null)} className="mb-4">
                            ← 講師一覧に戻る
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="md:col-span-1">
                                <CardHeader className="text-center">
                                    <Avatar className="w-24 h-24 mx-auto mb-4">
                                        <AvatarImage src={selectedInstructor.imageUrl || ""} alt={selectedInstructor.name || "Instructor"} />
                                        <AvatarFallback>{selectedInstructor.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <CardTitle>{selectedInstructor.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">{selectedInstructor.bio || "担当科目未設定"}</p>
                                </CardHeader>
                                <CardContent>
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        className="rounded-md border shadow mx-auto"
                                    />
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>
                                        {date ? format(date, "M月d日", { locale: ja }) : ""} の予約可能なコマ
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!date ? (
                                        <p className="text-muted-foreground">カレンダーから日付を選択してください。</p>
                                    ) : loadingShifts ? (
                                        <p>読み込み中...</p>
                                    ) : getShiftsForDate(date).length > 0 ? (
                                        getShiftsForDate(date).map(shift => (
                                            <Card key={shift.id} className="flex justify-between items-center p-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={shift.type === 'INDIVIDUAL' ? 'default' : 'secondary'}>
                                                            {shift.type === 'INDIVIDUAL' ? '個別' : shift.type === 'GROUP' ? '集団' : '特別'}
                                                        </Badge>
                                                        <span className="font-bold text-lg">
                                                            {formatTime(shift.start)} - {formatTime(shift.end)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        場所: {getLocationLabel(shift.location)}
                                                    </div>
                                                    {shift.className && <span className="text-sm font-bold mt-1 text-slate-600 dark:text-slate-300">{shift.className}</span>}
                                                </div>
                                                <Button onClick={() => openBookingDialog(shift)} disabled={isPending}>
                                                    予約
                                                </Button>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground">この日の空き枠はありません。</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">講師から選ぶ</h2>
                            <Button variant="outline" onClick={() => setIsRequestDialogOpen(true)}>
                                日程リクエストを送る
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {instructors.map((instructor) => (
                                <Card key={instructor.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelectInstructor(instructor)}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={instructor.imageUrl || ""} alt={instructor.name || "Instructor"} />
                                            <AvatarFallback>{instructor.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle>{instructor.name}</CardTitle>
                                            <CardDescription>{instructor.bio || "担当科目未設定"}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button className="w-full" variant="secondary">スケジュールを見る</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="history">
                <Card>
                    <CardHeader>
                        <CardTitle>予約履歴</CardTitle>
                        <CardDescription>過去の授業履歴を確認できます。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {initialBookings.length === 0 ? (
                                <p className="text-muted-foreground">履歴はありません。</p>
                            ) : (
                                initialBookings.map(booking => (
                                    <div key={booking.id} className="p-4 border rounded-lg flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-lg">
                                                {formatDate(booking.shift.start)} {formatTime(booking.shift.start)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                講師: {booking.shift.instructor.name} / {booking.shift.className || (booking.shift.type === 'INDIVIDUAL' ? "個別指導" : "集団授業")}
                                            </div>
                                            <div className="text-xs mt-1 px-2 py-0.5 bg-slate-100 rounded inline-block">
                                                {booking.meetingType === 'IN_PERSON' ? '対面受講' : 'オンライン受講'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Booking Dialog */}
            <Dialog open={!!selectedShiftForBooking} onOpenChange={(open) => !open && setSelectedShiftForBooking(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>授業予約の確認</DialogTitle>
                    </DialogHeader>
                    {selectedShiftForBooking && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <p>以下の授業を予約します。</p>
                                <div className="font-bold p-4 bg-slate-50 dark:bg-slate-800 rounded">
                                    <div className="text-lg">{formatDate(selectedShiftForBooking.start)}</div>
                                    <div className="text-xl text-blue-600">{formatTime(selectedShiftForBooking.start)} - {formatTime(selectedShiftForBooking.end)}</div>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        担当: {selectedInstructor?.name} <br />
                                        場所: {getLocationLabel(selectedShiftForBooking.location)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold">受講形態を選択してください</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant={meetingType === 'ONLINE' ? 'default' : 'outline'}
                                        onClick={() => setMeetingType('ONLINE')}
                                        className="h-auto py-4 flex flex-col gap-1"
                                    >
                                        <span>🖥️ オンライン</span>
                                        <span className="text-xs font-normal">Zoom等で受講</span>
                                    </Button>

                                    <Button
                                        variant={meetingType === 'IN_PERSON' ? 'default' : 'outline'}
                                        onClick={() => setMeetingType('IN_PERSON')}
                                        disabled={selectedShiftForBooking.location === 'ONLINE'}
                                        className="h-auto py-4 flex flex-col gap-1"
                                    >
                                        <span>🏫 校舎で受講</span>
                                        <span className="text-xs font-normal">
                                            {selectedShiftForBooking.location === 'ONLINE' ? 'オンラインのみ' : '対面で受講'}
                                        </span>
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setSelectedShiftForBooking(null)}>キャンセル</Button>
                                <Button onClick={handleBooking} disabled={isPending}>予約を確定する</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>日程リクエスト</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>講師</Label>
                            <Select onValueChange={setRequestInstructorId} value={requestInstructorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="講師を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {instructors.map(i => (
                                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>日付</Label>
                            <div className="flex justify-center border rounded-md p-2">
                                <Calendar
                                    mode="single"
                                    selected={requestDate}
                                    onSelect={setRequestDate}
                                    className=""
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>開始時間</Label>
                            <Input
                                type="time"
                                value={requestTime}
                                onChange={(e) => setRequestTime(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>終了時間</Label>
                            <Input
                                type="time"
                                value={requestEndTime}
                                onChange={(e) => setRequestEndTime(e.target.value)}
                                disabled={requestType === 'GROUP'}
                                className={requestType === 'GROUP' ? "bg-slate-100" : ""}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>授業場所</Label>
                            <Select onValueChange={setRequestLocation} value={requestLocation}>
                                <SelectTrigger>
                                    <SelectValue placeholder="場所を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ONLINE">オンライン（推奨）</SelectItem>
                                    <SelectItem value="TACHIKAWA">立川校舎</SelectItem>
                                    <SelectItem value="KICHIJOJI">吉祥寺校舎</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>授業種別</Label>
                            <Select onValueChange={setRequestType} value={requestType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="種別を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INDIVIDUAL">個別指導</SelectItem>
                                    <SelectItem value="GROUP">集団授業</SelectItem>
                                    <SelectItem value="SPECIAL">特別授業</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateRequest} disabled={isRequesting}>
                            {isRequesting ? '送信中...' : 'リクエストを送信'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}
