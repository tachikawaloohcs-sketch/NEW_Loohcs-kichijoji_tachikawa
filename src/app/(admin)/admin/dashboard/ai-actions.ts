"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function generateMaterialFromImage(base64Image: string, materialType: "EIKEN" | "ESSAY") {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return {
                error: "OPENAI_API_KEY が設定されていません。環境変数を設定してください。"
            };
        }

        // base64 padding cleanup if exists
        const base64Data = base64Image.split(',')[1] || base64Image;

        let prompt = "";
        if (materialType === "EIKEN") {
            prompt = `あなたは英検指導のプロフェッショナルです。
提供された画像（問題集や単語帳のページなど）を読み取り、以下のJSON配列として抽出・出力してください。
単語は複数抽出してください。

[
  {
    "id": ランダムなユニーク数値（3桁〜4桁）,
    "word": "英単語",
    "meaning": "日本語の意味（正解）",
    "wrongOptions": ["間違った選択肢1", "間違った選択肢2", "間違った選択肢3"]
  }
]

※ wrongOptions は該当単語に似ていない、明らかに意味が異なる日本語をランダムに推測して3つ生成してください。
※ JSONフォーマットのみを出力し、それ以外の説明文やマークダウン(\`\`\`)は含めないでください。`;
        } else {
            prompt = `あなたは小論文指導のプロフェッショナルです。
提供された画像（過去問やテーマ集など）を読み取り、以下のJSON配列として抽出・出力してください。
テーマは画像内から読み取れるだけ抽出してください。

[
  {
    "id": ランダムなユニーク数値（3桁〜4桁）,
    "title": "抽出した小論文のテーマ名",
    "type": "一般・時事 などのカテゴリ",
    "duration": "90分 などの想定時間",
    "wordCount": "800字 などの想定文字数",
    "status": "NEW"
  }
]

※ type, duration, wordCount など画像から読み取れない場合は、適当な標準値（社会科学、90分、800字など）を補完してください。
※ JSONフォーマットのみを出力し、それ以外の説明文やマークダウン(\`\`\`)は含めないでください。`;
        }

        const { text } = await generateText({
            model: openai("gpt-4o"),
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image", image: base64Data }
                    ]
                }
            ],
            temperature: 0.2,
        });

        // Parse JSON output safely
        try {
            // Remove markdown format if AI returns it
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const extractedData = JSON.parse(cleanedText);
            return { data: extractedData };
        } catch (parseError) {
            console.error("Failed to parse AI response:", text);
            return { error: "AIの応答を解析できませんでした。" };
        }
    } catch (error) {
        console.error("AI Error:", error);
        return { error: "AIリクエスト中にエラーが発生しました。画像サイズを小さくしてお試しください。" };
    }
}
