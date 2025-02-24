import {Composer} from "grammy";
import {Scraper, Tweet} from "agent-twitter-client";
import fs from "fs";

export function createTwitterComposer(scraper: Scraper) {
    const composer = new Composer();

    composer.errorBoundary((err, next) => {
        console.error("Ошибка в модуле twitter:", err);
        next();
    });

    composer.command("start", async (ctx) => {
        await ctx.reply(
            "Привет! Я бот, который может работать с Twitter. \nИспользуй /add_twitter <username> чтобы добавить username для отслеживания."
        );
    });

    composer.command("add_twitter", async (ctx) => {
        if (ctx.message?.text) {
            try {
                // Получаем текст сообщения
                const fullText = ctx.message.text;

                // Извлекаем текст после команды "add_twitter" и убираем лишние пробелы
                const command = "add_twitter";
                const textAfterCommand = fullText.slice(fullText.indexOf(command) + command.length).trim();

                // Проверяем, что текст после команды не пустой
                if (!textAfterCommand) {
                    await ctx.reply("Пожалуйста, укажите имя пользователя после команды.");
                    return;
                }

                // Читаем текущий список пользователей
                const data = fs.readFileSync("usernames.json", "utf8");
                const users = JSON.parse(data);

                // Добавляем новый username
                users.push(textAfterCommand);

                // Сохраняем обновленный список в файл
                fs.writeFileSync("usernames.json", JSON.stringify(users, null, 4));

                await ctx.reply(
                    `Username ${textAfterCommand} добавлен в список отслеживаемых.`
                );
            } catch (error) {
                // Если файла не существует, создаём новый
                if (error.code === "ENOENT") {
                    await fs.writeFileSync("usernames.json", JSON.stringify([ctx.message.text], null, 2));
                    await ctx.reply(
                        `Username ${ctx.message.text} добавлен в новый список отслеживаемых.`
                    );
                } else {
                    console.error("Ошибка:", error);
                    await ctx.reply("Произошла ошибка при обработке запроса.");
                }
            }
        } else {
            await ctx.reply(`Username не может быть пустым!`);
        }
    });

    return composer;
}
