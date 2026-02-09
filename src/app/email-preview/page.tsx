"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function EmailPreviewPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>("request_received");

  // Mock Data
  const mockStudent = { name: "山田 太郎", email: "student@example.com" };
  const mockInstructor = { name: "佐藤 花子", email: "instructor@example.com" };
  const mockDate = new Date();
  mockDate.setDate(mockDate.getDate() + 3);
  mockDate.setHours(14, 0, 0, 0);

  const formattedDate = format(mockDate, "MM/dd HH:mm", { locale: ja });

  const scenarios = [
    {
      id: "request_received",
      title: "日程リクエスト受信 (講師宛)",
      to: mockInstructor.email,
      from: "System (Student Action)",
      subject: "新しい日程リクエストが届きました",
      body: `生徒 ${mockStudent.name} から ${formattedDate} オンライン（推奨） 個別指導 の日程リクエストが届きました。\nダッシュボードから承認・却下を行ってください。\n\nhttp://localhost:3000/instructor/dashboard`
    },
    {
      id: "request_approved",
      title: "リクエスト承認 (生徒宛)",
      to: mockStudent.email,
      from: "System (Instructor Action)",
      subject: "日程リクエストが承認されました",
      body: `${formattedDate} オンライン（推奨） 個別指導 のリクエストが ${mockInstructor.name} 講師により承認されました。`
    },
    {
      id: "request_rejected",
      title: "リクエスト却下 (生徒宛)",
      to: mockStudent.email,
      from: "System (Instructor Action)",
      subject: "日程リクエストが却下されました",
      body: `リクエストされた日程は都合により承認されませんでした。別の日程で再度ご検討ください。`
    },
    {
      id: "booking_confirmed",
      title: "予約確定 (双方)",
      to: `${mockStudent.email}, ${mockInstructor.email}`,
      from: "System",
      subject: "予約確定しました。",
      body: `${formattedDate} - ${format(new Date(mockDate.getTime() + 3600000), "HH:mm", { locale: ja })} オンライン 個別指導 ${mockInstructor.name} 講師\n予約が確定しました。\nキャンセルは授業1日前までできます。`
    },
    {
      id: "booking_cancelled",
      title: "予約キャンセル (双方)",
      to: `${mockStudent.email}, ${mockInstructor.email}`,
      from: "System",
      subject: "予約がキャンセルされました。",
      body: `${formattedDate} - ${format(new Date(mockDate.getTime() + 3600000), "HH:mm", { locale: ja })} オンライン 個別指導 ${mockInstructor.name} 講師の予約がキャンセルされました。`
    },
    {
      id: "reminder",
      title: "授業1日前リマインド (双方)",
      to: `${mockStudent.email}, ${mockInstructor.email}`,
      from: "System",
      subject: "明日は授業です。",
      body: `明日の ${formattedDate} - ${format(new Date(mockDate.getTime() + 3600000), "HH:mm", { locale: ja })} オンライン 個別指導 ${mockInstructor.name} 講師\nの授業があります。お忘れ無く！！`
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedScenario);

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6">メール通知プレビュー</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-1/3 space-y-2">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedScenario === scenario.id
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
            >
              {scenario.title}
            </button>
          ))}
        </div>

        {/* Preview Area */}
        <div className="w-2/3 bg-white border rounded-lg shadow-sm">
          {currentScenario && (
            <div className="overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <div className="grid grid-cols-[60px_1fr] gap-2 text-sm">
                  <span className="text-gray-500 text-right">To:</span>
                  <span className="font-medium">{currentScenario.to}</span>

                  <span className="text-gray-500 text-right">From:</span>
                  <span className="text-gray-600">{currentScenario.from}</span>

                  <span className="text-gray-500 text-right">Subject:</span>
                  <span className="font-bold">{currentScenario.subject}</span>
                </div>
              </div>
              <div className="p-6 whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                {currentScenario.body}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
