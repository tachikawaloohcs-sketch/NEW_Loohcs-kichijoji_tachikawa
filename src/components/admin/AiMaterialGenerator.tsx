"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, UploadCloud, FileText, Image as ImageIcon, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { generateMaterialFromImage } from "@/app/(admin)/admin/dashboard/ai-actions";

export default function AiMaterialGenerator() {
    const [selectedType, setSelectedType] = useState<"EIKEN" | "ESSAY">("EIKEN");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultData, setResultData] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!imagePreview) return;
        setIsGenerating(true);
        setErrorMsg(null);
        setResultData(null);
        setCopied(false);

        try {
            // strip 'data:image/...' prefix
            // const base64Image = imagePreview.split(',')[1];

            const result = await generateMaterialFromImage(imagePreview, selectedType);

            if (result.error) {
                setErrorMsg(result.error);
            } else if (result.data) {
                setResultData(result.data);
            }
        } catch (error) {
            setErrorMsg("不明なエラーが発生しました。");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!resultData) return;
        const jsonString = JSON.stringify(resultData, null, 4);
        navigator.clipboard.writeText(jsonString).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <BrainCircuit className="w-8 h-8 text-[#006085]" />
                <div>
                    <h2 className="text-xl font-bold text-[#004661]">AI教材ジェネレーター (Vision OCR)</h2>
                    <p className="text-sm text-slate-500">紙の問題集や単語帳の画像を読み込ませて、Locus形式のJSONデータを自動生成します。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Upload and Settings */}
                <div className="space-y-6">
                    {/* Material Type Selection */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">生成する教材のタイプ</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setSelectedType("EIKEN")}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all flex justify-center items-center gap-2 ${selectedType === "EIKEN" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-blue-200"
                                    }`}
                            >
                                <BrainCircuit className="w-5 h-5" />
                                英検 単語データ
                            </button>
                            <button
                                onClick={() => setSelectedType("ESSAY")}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all flex justify-center items-center gap-2 ${selectedType === "ESSAY" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-500 hover:border-rose-200"
                                    }`}
                            >
                                <FileText className="w-5 h-5" />
                                小論文 テーマデータ
                            </button>
                        </div>
                    </div>

                    {/* Image Upload Area */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">画像のアップロード</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                            {imagePreview ? (
                                <div className="space-y-4">
                                    <div className="relative aspect-video max-h-48 overflow-hidden rounded-lg mx-auto">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                    </div>
                                    <p className="text-xs text-slate-400">画像をクリックして変更</p>
                                </div>
                            ) : (
                                <div className="space-y-4 py-8 pointer-events-none">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                    <p className="font-bold text-slate-600">ここをクリックして画像を選択<br />またはクリックしてアップロード</p>
                                    <p className="text-xs text-slate-400">対応フォーマット: JPG, PNG</p>
                                </div>
                            )}
                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={!imagePreview || isGenerating}
                        className="w-full h-14 bg-[#004661] hover:bg-[#00344d] text-white font-bold text-lg rounded-xl shadow-lg"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> GPT-4o Vision で生成中...</>
                        ) : (
                            <><UploadCloud className="w-5 h-5 mr-2" /> 画像からデータを抽出する</>
                        )}
                    </Button>

                    {errorMsg && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* Right Column: Output Area */}
                <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-start border border-slate-800">
                    <div className="flex items-center justify-between w-full mb-4 px-2">
                        <span className="text-sm font-mono text-emerald-400 font-bold uppercase tracking-wider">Output .json</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            disabled={!resultData}
                            className="text-slate-400 hover:text-white"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? "Copied!" : "コードをコピー"}
                        </Button>
                    </div>

                    <div className="flex-1 w-full bg-black/50 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-300 relative">
                        {!resultData && !isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                抽出されたデータがここにJSONで表示されます。
                            </div>
                        )}
                        {isGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span>Reading Image...</span>
                            </div>
                        )}
                        {resultData && (
                            <pre className="whitespace-pre-wrap word-break">
                                {JSON.stringify(resultData, null, 2)}
                            </pre>
                        )}
                    </div>

                    <div className="w-full mt-4 p-3 bg-blue-900/30 border border-blue-900/50 rounded-lg text-xs leading-relaxed text-blue-200">
                        <strong className="block mb-1 text-blue-300">💡 活用方法</strong>
                        ここでコピーしたJSONデータを、該当のソースコード内の `VOCAB_DATABASE` または `ESSAY_THEMES` 配列に直接貼り付けるだけで、生徒の画面に新しい勉強道具として登場します。
                    </div>
                </div>
            </div>
        </div>
    );
}
