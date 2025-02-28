import {login} from "./x/twitterAuth";
import startBot from "./telegram/telegramBot";
import dotenv from 'dotenv';
import {ENV, getSanitizedConfig} from "./getSanitizedConfig";
import {Bot} from "grammy";
import OpenAI from "openai";

dotenv.config();

export const getConfig = (): ENV => {
    return {
        BOT_TOKEN: process.env.BOT_TOKEN,
        OPEN_AI_KEY: process.env.OPEN_AI_KEY
    };
};

const config = getConfig();
export const sanitizedConfig = getSanitizedConfig(config);

console.log(`botToken: ${sanitizedConfig.BOT_TOKEN}`)
console.log(`openAiKey: ${sanitizedConfig.OPEN_AI_KEY}`)

export const bot = new Bot(sanitizedConfig.BOT_TOKEN);
export const openai = new OpenAI({
    apiKey: sanitizedConfig.OPEN_AI_KEY
});

async function main() {
    const scraper = await login();

    if (!await scraper.isLoggedIn()) {
        console.error('Failed to authenticate with Twitter');
        return;
    }

    await startBot(scraper, bot);
}

main();