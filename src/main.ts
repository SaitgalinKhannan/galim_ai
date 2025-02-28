import {login} from "./x/twitterAuth";
import startBot from "./telegram/telegramBot";

export const botToken = process.env.BOT_TOKEN;
export const openAiKey = process.env.OPEN_AI_KEY;

async function main() {
    const scraper = await login();

    if (!await scraper.isLoggedIn()) {
        console.error('Failed to authenticate with Twitter');
        return;
    }

    await startBot(scraper);
}

main();