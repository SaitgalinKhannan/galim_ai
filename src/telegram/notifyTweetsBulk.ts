import {Tweet} from "agent-twitter-client";
import {bot} from "./telegramBot";

const CHAT_ID = -1002108370914;

/**
 * Отправляем отдельное сообщение для каждого твита.
 */
export async function notifyTweetsBulk(username: string, tweets: Tweet[]) {
    if (tweets.length === 0) return;

    for (const tweet of tweets) {
        // Сформируем ссылку на сам твит
        // Можно использовать поле tweet.permanentUrl, если Scraper его возвращает,
        // или собрать вручную: https://twitter.com/<username>/status/<id>
        const tweetLink = tweet.permanentUrl
            ? tweet.permanentUrl
            : `https://twitter.com/${tweet.username}/status/${tweet.id}`;

        // Дата, если нужна (tweet.timeParsed может быть Date, проверим, что не undefined)
        let dateString = "";
        if (tweet.timeParsed) {
            // Можем использовать dayjs или другой форматтер,
            // или просто toLocaleString():
            dateString = `\n🕒 ${tweet.timeParsed.toLocaleString()}`;
        }

        // Составляем текст сообщения
        const message =
            ```<b>Пользователь:</b> <a href="https://twitter.com/${tweet.username}">${tweet.name || tweet.username}</a>
            <b>Текст:</b> ${tweet.text || ""}
            ${dateString}
            <b>Ссылка на твит:</b> <a href="${tweetLink}">${tweetLink}</a>`.trim();

        // Отправляем сообщение с использованием HTML-разметки
        await bot.api.sendMessage(
            CHAT_ID,
            message,
            {
                parse_mode: "HTML",
                disable_web_page_preview: false // если хотите превью ссылок (для фото, например)
            }
        );
    }

    console.log(`Отправлено ${tweets.length} уведомлений о твитах для пользователя "${username}".`);
}