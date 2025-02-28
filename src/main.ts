import {login} from "./x/twitterAuth";
import startBot from "./telegram/telegramBot";

export const botToken: string = process.env.BOT_TOKEN!!;
export const openAiKey: string = process.env.OPEN_AI_KEY!!;

console.log(`botToken: ${botToken}`)
console.log(`openAiKey: ${openAiKey}`)

async function main() {
    const scraper = await login();

    if (!await scraper.isLoggedIn()) {
        console.error('Failed to authenticate with Twitter');
        return;
    }

    await startBot(scraper);
}

main();