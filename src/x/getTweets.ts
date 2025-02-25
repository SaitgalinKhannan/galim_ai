import fs from "fs";
import {Scraper, Tweet} from "agent-twitter-client";
import {Bot} from "grammy";
import cron from "node-cron";
import {getLastSeenTweetId, saveTweet, setLastSeenTweetId} from "../database/tweets";
import {analyzeAndNotifyTweetsBulk} from "../telegram/analyzeAndNotifyTweetsBulk";
import {analyzeTweetText} from "../ai/analyzeTweet";

async function getTweetsForUser(scraper: Scraper, user: string, maxTweets: number): Promise<Tweet[]> {
    const tweets: Tweet[] = [];
    // scraper.getTweets(...) возвращает AsyncGenerator, нужно "вычитать" из него данные
    for await (const tweet of scraper.getTweets(user, maxTweets)) {
        tweets.push(tweet);
    }
    return tweets;
}

// ВАЖНО: у Twitter ID — это строковые числа. Сравнивайте их корректно.
// Иногда лучше переводить в BigInt или number (если помещается в number).
function isNewerTweet(currentId: string, lastId: string) {
    // Сравним как BigInt:
    return BigInt(currentId) > BigInt(lastId);
}

// Допустим, мы храним именно "id" (который у Twitter обычно длинное число в строке)
export async function fetchAndSaveNewTweetsForUser(
    scraper: Scraper,
    username: string,
    max = 10
) {
    if (username === "" || username === null) {
        return;
    }

    const lastId = getLastSeenTweetId(username); // "1234567890" или null
    const tweets = await getTweetsForUser(scraper, username, max);

    // Если нет lastId, значит берём все твиты (впервые)
    let newTweets = tweets;
    if (lastId) {
        newTweets = tweets.filter(tweet =>
            tweet.id && isNewerTweet(tweet.id, lastId)
        );
    }

    // Сортируем новые твиты от старых к свежим (чтобы потом правильно обновить lastSeen)
    // Многие API отдают сверху вниз (свежий->старый), но убедимся, что порядок верный
    newTweets.sort((a, b) => {
        const aId = BigInt(a.id!);
        const bId = BigInt(b.id!);

        if (aId < bId) return -1;
        if (aId > bId) return 1;
        return 0;
    });

    // Сохраняем каждое в таблицу
    for (const tweet of newTweets) {
        saveTweet(tweet);
    }

    // Если появились новые твиты, обновим "последний твит"
    if (newTweets.length > 0) {
        const newest = newTweets[newTweets.length - 1]; // последний в отсортированном списке
        if (newest.id) {
            setLastSeenTweetId(username, newest.id);
        }
        await analyzeAndNotifyTweetsBulk(username, newTweets);
        console.log(`Пользователь "${username}": сохранили ${newTweets.length} новых твитов`);
    } else {
        console.log(`Пользователь "${username}": нет новых твитов`);
    }
}

export function scheduleTweetFetching(scraper: Scraper, bot: Bot) {
    // Функция, которая будет вызываться каждую минуту
    async function checkTweets() {
        try {
            const users = JSON.parse(fs.readFileSync("usernames.json", "utf8")) as string[];
            for (const user of users) {
                await fetchAndSaveNewTweetsForUser(scraper, user, 10);
            }
        } catch (e) {
            console.error("Ошибка в checkTweets:", e);
        }
    }

    // Вызываем сразу при старте (не ждём минуту):
    checkTweets();

    // Далее запускаем setInterval, чтобы вызывать каждые 60 секунд:
    //setInterval(fetchTweets, 60_000);
    //cron.schedule("* * * * *", checkTweets);
    cron.schedule("*/2 * * * *", checkTweets);
}
