import {login} from "./x/twitterAuth";
import startBot from "./telegram/telegramBot";

async function main() {
    const scraper = await login();

    if (!await scraper.isLoggedIn()) {
        console.error('Failed to authenticate with Twitter');
        return;
    }

    await startBot(scraper);
}

main();