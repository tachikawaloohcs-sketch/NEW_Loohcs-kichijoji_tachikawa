"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function generateRefutation(hypothesis: string, premises: string[]) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return {
                error: "OPENAI_API_KEY が設定されていません。環境変数を設定してください。"
            };
        }

        const prompt = `
あなたは探究学習・学術研究を専門とする極めて厳格で論理的な「反論AI（Refutation AI）」です。
生徒が立てた仮説や前提に対して、徹底的に反駁（ツッコミ）を入れてください。
ただし、単なるいちゃもんではなく、必ず**「引用数の高い有名な論文、または信頼できる学術的データ・先行研究」**を論拠として用いてください。

以下の生徒の仮説と未検証の前提に対して、2パターンの異なる角度からの反論（反証）を生成してください。

【生徒の仮説】
${hypothesis}

【生徒の未検証の前提（思い込み）】
${premises.join("\n")}

【出力フォーマット（厳守）】
以下のJSONフォーマットのみを出力してください。プレーンテキストやマークダウンのコードブロック(\`\`\`)は不要です。

[
  {
    "title": "【反論1の簡潔なタイトル】",
    "content": "反論の詳細な内容。〇〇の調査（著者名, 発表年）などを引用し、なぜその前提や仮説が危険・飛躍しているのかを論理的に指摘する。"
  },
  {
    "title": "【反論2の簡潔なタイトル】",
    "content": "反論の詳細な内容。異なるアプローチからの先行研究を引用する。"
  }
]
`;

        const { text } = await generateText({
            model: openai("gpt-4o"),
            prompt: prompt,
            temperature: 0.7,
        });

        // Parse JSON output safely
        try {
            // Remove markdown format if AI returns it
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const refutations = JSON.parse(cleanedText);
            return { refutations };
        } catch (parseError) {
            console.error("Failed to parse AI response:", text);
            return { error: "AIの応答を解析できませんでした。" };
        }
    } catch (error) {
        console.error("AI Error:", error);
        return { error: "AIの実行中にエラーが発生しました。" };
    }
}
