import Database from "better-sqlite3";
import {Tweet} from "agent-twitter-client";

const db = new Database("/app/data/tweets.db"); // /app/data/

// Таблица для хранения самих твитов
db.prepare(`
    CREATE TABLE IF NOT EXISTS tweets
    (
        id              TEXT PRIMARY KEY,
        conversation_id TEXT,
        user_id         TEXT,
        username        TEXT,
        text            TEXT,
        timestamp       INTEGER,
        json_data       TEXT
    )
`).run();

// Таблица для хранения «последнего обработанного твита»
db.prepare(`
    CREATE TABLE IF NOT EXISTS last_seen_tweets
    (
        username      TEXT PRIMARY KEY,
        last_tweet_id TEXT
    )
`).run();

export function saveTweet(tweet: Tweet) {
    const insert = db.prepare(`
        INSERT OR
        REPLACE
        INTO tweets (id, conversation_id, user_id, username, text, timestamp, json_data)
        VALUES (@id, @conversationId, @userId, @username, @text, @timestamp, @jsonData)
    `);

    insert.run({
        id: tweet.id,
        conversationId: tweet.conversationId ?? null,
        userId: tweet.userId ?? null,
        username: tweet.username ?? null,
        text: tweet.text ?? null,
        timestamp: tweet.timestamp ?? null,
        jsonData: JSON.stringify(tweet),
    });
}

/**
 * Получить ID последнего твита, который мы уже обработали у данного пользователя.
 * Вернёт null, если ничего не найдено.
 */
export function getLastSeenTweetId(username: string): string | null {
    const row = db.prepare(`
        SELECT last_tweet_id
        FROM last_seen_tweets
        WHERE username = ?
    `).get(username);

    if (!row) return null;
    // @ts-ignore
    return row.last_tweet_id;
}

/**
 * Сохранить (или обновить) ID последнего твита, который мы обработали у пользователя.
 */
export function setLastSeenTweetId(username: string, lastTweetId: string) {
    db.prepare(`
        INSERT OR
        REPLACE
        INTO last_seen_tweets (username, last_tweet_id)
        VALUES (@username, @lastTweetId)
    `).run({
        username,
        lastTweetId,
    });
}

