"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Report {
    id: string;
    content: string;
    homework: string | null;
    feedback: string | null;
    logUrl: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

interface Booking {
    id: string;
    shift: {
        start: Date;
        instructor: { name: string | null };
    };
    report: Report | null;
}

interface AdmissionResult {
    id: string;
    schoolName: string;
    department?: string | null;
    rank: number;
    status: string; // "PENDING", "PASSED", "FAILED", "WITHDRAWN"
}

interface Student {
    id: string;
    name: string | null;
    email: string;
    studentBookings: Booking[];
    admissionResults?: AdmissionResult[];
    // Profile Fields
    schoolName?: string | null;
    grade?: string | null;
    researchTheme?: string | null;
    gpa?: number | null;
    qualifications?: string | null;
    canInternalUpgrade?: boolean | null;
    dedicatedInstructor?: { id: string; name: string | null } | null;
}

interface CarteViewerProps {
    students: Student[];
    allInstructors?: { id: string; name: string | null }[]; // For dedicated instructor selection
    editable?: boolean; // If true, allows editing admission results (Instructors/Admins)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdateAdmission?: (studentId: string, results: any[]) => Promise<{ success?: boolean; error?: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdateProfile?: (studentId: string, data: any) => Promise<{ success?: boolean; error?: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdateReport?: (reportId: string, data: any) => Promise<{ success?: boolean; error?: string }>;
}

export function CarteViewer({ students, allInstructors = [], editable, onUpdateAdmission, onUpdateProfile, onUpdateReport }: CarteViewerProps) {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const formatDate = (d: Date) => format(new Date(d), "yyyy/MM/dd HH:mm");

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student List */}
            <Card className="md:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>生徒一覧</CardTitle>
                    <CardDescription>生徒を選択して過去のカルテを閲覧</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {students.length === 0 ? (
                        <p className="text-muted-foreground">生徒がいません</p>
                    ) : (
                        students.map(student => (
                            <div
                                key={student.id}
                                className={`flex items-center gap-4 p-3 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${selectedStudent?.id === student.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                                onClick={() => setSelectedStudent(student)}
                            >
                                <Avatar>
                                    <AvatarFallback>{student.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{student.name}</div>
                                    <div className="text-xs text-muted-foreground">{student.email}</div>
                                    <div className="text-xs text-blue-600 mt-1">カルテ数: {student.studentBookings.length}</div>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Report View */}
            <div className="md:col-span-2 space-y-6">
                {selectedStudent ? (
                    <>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedStudent.name} さんのカルテ一覧</h2>
                                <p className="text-muted-foreground">{selectedStudent.email}</p>
                            </div>
                            <div className="flex gap-2">
                                {editable && onUpdateProfile && (
                                    <ProfileEditDialog student={selectedStudent} allInstructors={allInstructors} onUpdate={onUpdateProfile} />
                                )}
                                {editable && onUpdateAdmission && (
                                    <AdmissionEditDialog student={selectedStudent} onUpdate={onUpdateAdmission} />
                                )}
                            </div>
                        </div>

                        {/* Student Profile Info */}
                        <ProfileInfoCard
                            student={selectedStudent}
                            allInstructors={allInstructors}
                            editable={editable}
                            onUpdate={onUpdateProfile}
                        />

                        {/* Admission Results Summary */}
                        {selectedStudent.admissionResults && selectedStudent.admissionResults.length > 0 && (
                            <Card className="bg-slate-50 dark:bg-slate-900 border-none">
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-2">志望校・合否状況</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.admissionResults.map(res => (
                                            <div key={res.id} className="bg-white dark:bg-black border rounded px-3 py-1 text-sm flex items-center gap-2">
                                                <span className={`font-bold ${res.rank === 1 ? 'text-red-500' : ''}`}>
                                                    {res.rank === 1 ? '第一志望' : `第${res.rank}志望`}
                                                </span>
                                                <span>{res.schoolName} {res.department}</span>
                                                <AdmissionStatusBadge status={res.status} />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {selectedStudent.studentBookings.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    提出されたカルテはありません。
                                </CardContent>
                            </Card>
                        ) : (
                            selectedStudent.studentBookings.map(booking => (
                                booking.report && (
                                    <Card key={booking.id}>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex justify-between">
                                                <span>{formatDate(booking.shift.start)}</span>
                                                <div className="flex items-center gap-2">
                                                    {booking.report.submittedLate && (
                                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">遅延提出</span>
                                                    )}
                                                    {(function () {
                                                        const created = new Date(booking.report!.createdAt);
                                                        const updated = new Date(booking.report!.updatedAt);
                                                        if (updated.getTime() - created.getTime() > 60 * 1000) {
                                                            return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">編集済</span>;
                                                        }
                                                        return null;
                                                    })()}
                                                    <span className="text-base font-normal text-muted-foreground">講師: {booking.shift.instructor.name}</span>
                                                </div>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1">実施内容・所感</h4>
                                                <p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded whitespace-pre-wrap">{booking.report.content}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">宿題</h4>
                                                    <p className="text-sm">{booking.report.homework || "なし"}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">講師への連絡事項</h4>
                                                    <p className="text-sm">{booking.report.feedback || "なし"}</p>
                                                </div>
                                            </div>
                                            {booking.report.logUrl && (
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">ログURL</h4>
                                                    <a href={booking.report.logUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                                                        {booking.report.logUrl}
                                                    </a>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            ))
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
                        左のリストから生徒を選択してください
                    </div>
                )}
            </div>
        </div>
    );
}

// Profile Info Card with Inline Editing
function ProfileInfoCard({
    student,
    allInstructors,
    editable,
    onUpdate
}: {
    student: Student;
    allInstructors: { id: string; name: string | null }[];
    editable?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate?: (studentId: string, data: any) => Promise<{ success?: boolean; error?: string }>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        schoolName: student.schoolName || "",
        grade: student.grade || "",
        researchTheme: student.researchTheme || "",
        gpa: student.gpa?.toString() || "",
        qualifications: student.qualifications || "",
        canInternalUpgrade: student.canInternalUpgrade !== null ? student.canInternalUpgrade?.toString() : "",
        dedicatedInstructorName: student.dedicatedInstructor?.name || ""
    });

    const handleSave = async () => {
        if (!onUpdate) return;
        const payload = {
            ...formData,
            gpa: formData.gpa ? parseFloat(formData.gpa) : null,
            canInternalUpgrade: formData.canInternalUpgrade === "true" ? true : formData.canInternalUpgrade === "false" ? false : null,
            dedicatedInstructorName: formData.dedicatedInstructorName || null
        };
        await onUpdate(student.id, payload);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            schoolName: student.schoolName || "",
            grade: student.grade || "",
            researchTheme: student.researchTheme || "",
            gpa: student.gpa?.toString() || "",
            qualifications: student.qualifications || "",
            canInternalUpgrade: student.canInternalUpgrade !== null ? student.canInternalUpgrade?.toString() : "",
            dedicatedInstructorName: student.dedicatedInstructor?.name || ""
        });
        setIsEditing(false);
    };

    return (
        <Card className="bg-white dark:bg-slate-950">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-semibold">基本情報</h3>
                    {editable && onUpdate && (
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button variant="outline" size="sm" onClick={handleCancel}>キャンセル</Button>
                                    <Button size="sm" onClick={handleSave}>保存</Button>
                                </>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>編集</Button>
                            )}
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>所属高校</Label>
                                <Input value={formData.schoolName} onChange={e => setFormData({ ...formData, schoolName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>学年</Label>
                                <Input value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} placeholder="例: 高2" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>研究テーマ</Label>
                            <Input value={formData.researchTheme} onChange={e => setFormData({ ...formData, researchTheme: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>評定平均</Label>
                            <Input type="number" step="0.1" value={formData.gpa} onChange={e => setFormData({ ...formData, gpa: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>内部進学の可否</Label>
                            <Select value={formData.canInternalUpgrade} onValueChange={v => setFormData({ ...formData, canInternalUpgrade: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="選択してください" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">可能</SelectItem>
                                    <SelectItem value="false">不可</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>資格・実績</Label>
                            <Input value={formData.qualifications} onChange={e => setFormData({ ...formData, qualifications: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>専任講師</Label>
                            <Input value={formData.dedicatedInstructorName} onChange={e => setFormData({ ...formData, dedicatedInstructorName: e.target.value })} placeholder="講師名を入力" />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground font-medium">所属高校</span>
                            <span className="col-span-2">{student.schoolName || "-"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground font-medium">学年</span>
                            <span className="col-span-2">{student.grade || "-"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground font-medium">研究テーマ</span>
                            <span className="col-span-2">{student.researchTheme || "-"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground font-medium">評定平均</span>
                            <span className="col-span-2">{student.gpa || "-"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground font-medium">内部進学</span>
                            <span className="col-span-2">{student.canInternalUpgrade === null ? "-" : student.canInternalUpgrade ? "可能" : "不可"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground font-medium">専任講師</span>
                            <span className="col-span-2">{student.dedicatedInstructor?.name || "-"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2">
                            <span className="text-muted-foreground font-medium">資格・実績</span>
                            <span className="col-span-2 whitespace-pre-wrap">{student.qualifications || "-"}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AdmissionStatusBadge({ status }: { status: string }) {
    const styles = {
        PENDING: "bg-gray-100 text-gray-700",
        PASSED: "bg-red-100 text-red-700 font-bold",
        FAILED: "bg-blue-100 text-blue-700",
        WITHDRAWN: "bg-yellow-100 text-yellow-700",
    };
    const labels = {
        PENDING: "受験予定/結果待ち",
        PASSED: "合格",
        FAILED: "不合格",
        WITHDRAWN: "辞退",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const style = (styles as any)[status] || styles.PENDING;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const label = (labels as any)[status] || status;

    return <span className={`px-2 py-0.5 rounded text-xs ${style}`}>{label}</span>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdmissionEditDialog({ student, onUpdate }: { student: Student, onUpdate: (id: string, results: any[]) => Promise<any> }) {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<AdmissionResult[]>(student.admissionResults || []);

    const handleSave = async () => {
        await onUpdate(student.id, results);
        setOpen(false);
    };

    const addRow = () => {
        setResults([...results, { id: Math.random().toString(), schoolName: "", rank: results.length + 1, status: "PENDING" }]);
    };

    const updateRow = (index: number, field: keyof AdmissionResult, value: any) => {
        const newResults = [...results];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newResults[index] as any)[field] = value;
        setResults(newResults);
    };

    const removeRow = (index: number) => {
        setResults(results.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">志望校・合否編集</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>志望校・合否情報の編集 - {student.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        {results.map((res, index) => (
                            <div key={res.id} className="flex gap-2 items-center">
                                <div className="w-20">
                                    <Label className="text-xs">志望順位</Label>
                                    <Input
                                        type="number"
                                        value={res.rank}
                                        onChange={e => updateRow(index, "rank", parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">学校名</Label>
                                    <Input
                                        value={res.schoolName}
                                        onChange={e => updateRow(index, "schoolName", e.target.value)}
                                        placeholder="〇〇大学"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">学部・学科</Label>
                                    <Input
                                        value={res.department || ""}
                                        onChange={e => updateRow(index, "department", e.target.value)}
                                        placeholder="法学部"
                                    />
                                </div>
                                <div className="w-32">
                                    <Label className="text-xs">ステータス</Label>
                                    <Select value={res.status} onValueChange={val => updateRow(index, "status", val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">受験予定</SelectItem>
                                            <SelectItem value="PASSED">合格</SelectItem>
                                            <SelectItem value="FAILED">不合格</SelectItem>
                                            <SelectItem value="WITHDRAWN">辞退</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="mt-6">
                                    <Button variant="ghost" size="icon" onClick={() => removeRow(index)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addRow} className="w-full border-dashed">
                        <Plus className="h-4 w-4 mr-2" />
                        志望校を追加
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>保存</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProfileEditDialog({ student, allInstructors, onUpdate }: { student: Student, allInstructors: { id: string, name: string | null }[], onUpdate: (id: string, data: any) => Promise<any> }) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        schoolName: student.schoolName || "",
        grade: student.grade || "",
        researchTheme: student.researchTheme || "",
        gpa: student.gpa?.toString() || "",
        qualifications: student.qualifications || "",
        canInternalUpgrade: student.canInternalUpgrade !== null ? student.canInternalUpgrade?.toString() : "",
        dedicatedInstructorId: student.dedicatedInstructor?.id || "None"
    });

    const handleSave = async () => {
        const payload = {
            ...formData,
            gpa: formData.gpa ? parseFloat(formData.gpa) : null,
            canInternalUpgrade: formData.canInternalUpgrade === "true" ? true : formData.canInternalUpgrade === "false" ? false : null
        };
        await onUpdate(student.id, payload);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">基本情報編集</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>基本情報の編集 - {student.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>所属高校</Label>
                            <Input value={formData.schoolName} onChange={e => setFormData({ ...formData, schoolName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>学年</Label>
                            <Input value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} placeholder="例: 高2" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>研究テーマ</Label>
                        <Input value={formData.researchTheme} onChange={e => setFormData({ ...formData, researchTheme: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>評定平均</Label>
                        <Input type="number" step="0.1" value={formData.gpa} onChange={e => setFormData({ ...formData, gpa: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>内部進学の可否</Label>
                        <Select value={formData.canInternalUpgrade} onValueChange={v => setFormData({ ...formData, canInternalUpgrade: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">可能</SelectItem>
                                <SelectItem value="false">不可</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>資格・実績</Label>
                        <Input value={formData.qualifications} onChange={e => setFormData({ ...formData, qualifications: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>専任講師</Label>
                        <Select value={formData.dedicatedInstructorId} onValueChange={v => setFormData({ ...formData, dedicatedInstructorId: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="担当なし" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None">担当なし</SelectItem>
                                {allInstructors.map(inst => (
                                    <SelectItem key={inst.id} value={inst.id}>{inst.name || "名称未設定"}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>保存</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
