import {z} from "zod";
import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";
import {openAiKey} from "../main";

// тип данных, который хотим получить от анализа
const CryptoTweetSchema = z.object({
    isAboutCrypto: z.boolean(),
    isAboutBlockchain: z.boolean(),
    isAboutTokenLaunch: z.boolean(),
    contractAddress: z.string().nullable(),
});

interface CryptoTweet {
    isAboutCrypto: boolean;
    isAboutBlockchain: boolean;
    isAboutTokenLaunch: boolean;
    contractAddress: string | null;
}

export type CryptoTweetAnalysis = z.infer<typeof CryptoTweetSchema>;

const openai = new OpenAI({
    apiKey: openAiKey
});

export async function analyzeTweetText(tweetText: string): Promise<CryptoTweetAnalysis | null> {
    try {
        // Тут формируем список сообщений в стиле ChatGPT
        const messages = [
            {
                role: "system" as const,
                content: `
                You are an expert at structured data extraction. 
                You'll receive a tweet text and classify it into the following fields:
                
                {
                  "isAboutCrypto": boolean,
                  "isAboutBlockchain": boolean,
                  "isAboutTokenLaunch": boolean,
                  "contractAddress": string | null
                }
                
                If no contract address is found in the text, return null for "contractAddress".
                Make sure to respond ONLY in JSON that matches the given schema exactly.
            `,
            },
            {
                role: "user" as const,
                content: `
                Here is the tweet text:
                """
                ${tweetText}
                """
            `,
            },
        ];

        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o",
            messages,
            response_format: zodResponseFormat(CryptoTweetSchema, "crypto_tweet_analysis"),
            temperature: 0
        });

        // Библиотека сама сделает JSON-parse и провалидирует данные через Zod.
        // Если GPT не вернёт соответствие схеме, будет выброшена ошибка.
        const result: CryptoTweetAnalysis = <CryptoTweetAnalysis>completion.choices[0].message.parsed;

        // result уже прошёл Zod-проверку, значит имеет форму:
        // {
        //   isAboutCrypto: boolean;
        //   isAboutBlockchain: boolean;
        //   isAboutTokenLaunch: boolean;
        //   contractAddress: string | null;
        // }

        return result;
    } catch (e) {
        return null;
    }
}

export async function explainTweet(tweetText: string): Promise<string | null> {
    if (!tweetText.trim()) return null;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "Ты помощник, который кратко объясняет содержание твита на русском языке. Отвечай только объяснением, без дополнительного текста или форматирования.",
                },
                {role: "user", content: tweetText},
            ],
            max_tokens: 100,
            temperature: 0.3,
        });

        return response.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.error("Error explain tweet:", error);
        return null;
    }
}
