import {Tweet} from "agent-twitter-client";
import {analyzeTweetText, CryptoTweetAnalysis, explainTweet} from "../ai/analyzeTweet";
import {bot} from "../main";

const CHAT_ID = -1002394284052;
const CA_THREAD = 114
const TWEET_THREAD = 119
const CRYPTO_TWEET_THREAD = 449

/**
 * Отправляем отдельное сообщение для каждого твита.
 */
export async function analyzeAndNotifyTweetsBulk(username: string, tweets: Tweet[]) {
    if (tweets.length === 0) return;

    for (const tweet of tweets) {
        let analysis: CryptoTweetAnalysis | null;
        let explain: string | null;

        if (tweet.text) {
            analysis = await analyzeTweetText(tweet.text);
            explain = await explainTweet(tweet.text);
            console.log(analysis);
        } else {
            analysis = null;
            explain = null;
        }

        // Сформируем ссылку на сам твит
        // Можно использовать поле tweet.permanentUrl, если Scraper его возвращает,
        // или собрать вручную: https://twitter.com/<username>/status/<id>
        const tweetLink = tweet.permanentUrl
            ? tweet.permanentUrl
            : `https://twitter.com/${tweet.username}/status/${tweet.id}`;

        if (analysis && (analysis.contractAddress || analysis.contractAddress !== "")) {
            const message = `Новый твит о крипте от ${tweet.username}:
${tweet.text}

<b>Contract Address:</b> <code>${analysis.contractAddress}</code>

<b>Explain: ${explain || ""}</b>
<b>Ссылка на твит:</b> <a href="${tweetLink}">${tweetLink}</a>`

            await bot.api.sendMessage(CHAT_ID, message, {
                message_thread_id: CA_THREAD,
                parse_mode: "HTML"
            });
        } else if (analysis?.isAboutCrypto || analysis?.isAboutTokenLaunch) {
            // Дата, если нужна (tweet.timeParsed может быть Date, проверим, что не undefined)
            let dateString = "";
            if (tweet.timeParsed) {
                // Можем использовать dayjs или другой форматтер,
                // или просто toLocaleString():
                dateString = `\n🕒 ${tweet.timeParsed.toLocaleString()}`;
            }

            // Составляем текст сообщения
            const message =
                `<b>Пользователь:</b> <a href="https://twitter.com/${tweet.username}">${tweet.name || tweet.username}</a>
<b>Текст:</b> ${tweet.text || ""}
${dateString}

<b>Explain: ${explain || ""}</b>
<b>Ссылка на твит:</b> <a href="${tweetLink}">${tweetLink}</a>`;

            // Отправляем сообщение с использованием HTML-разметки
            await bot.api.sendMessage(CHAT_ID, message, {
                message_thread_id: CRYPTO_TWEET_THREAD,
                parse_mode: "HTML"
            });
        } else {
            // Дата, если нужна (tweet.timeParsed может быть Date, проверим, что не undefined)
            let dateString = "";
            if (tweet.timeParsed) {
                // Можем использовать dayjs или другой форматтер,
                // или просто toLocaleString():
                dateString = `\n🕒 ${tweet.timeParsed.toLocaleString()}`;
            }

            // Составляем текст сообщения
            const message =
                `<b>Пользователь:</b> <a href="https://twitter.com/${tweet.username}">${tweet.name || tweet.username}</a>
<b>Текст:</b> ${tweet.text || ""}
${dateString}

<b>Explain: ${explain || ""}</b>
<b>Ссылка на твит:</b> <a href="${tweetLink}">${tweetLink}</a>`;

            // Отправляем сообщение с использованием HTML-разметки
            await bot.api.sendMessage(CHAT_ID, message, {
                message_thread_id: TWEET_THREAD,
                parse_mode: "HTML"
            });
        }

        console.log(`Отправлено ${tweets.length} уведомлений о твитах для пользователя "${username}".`);
    }
}