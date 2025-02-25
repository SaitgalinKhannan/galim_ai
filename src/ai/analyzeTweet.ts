import {z} from "zod";
import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";

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
    apiKey: "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"
});

export async function analyzeTweetText(tweetText: string): Promise<CryptoTweetAnalysis | null> {
    try{
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
    }catch (e) {
        return  null;
    }
}

