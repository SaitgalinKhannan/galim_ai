import {Composer} from "grammy";
import {Scraper, Tweet} from "agent-twitter-client";
import fs from "fs";
import {isErrnoException} from "../utils";

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
                const users: string[] = JSON.parse(data);

                // Добавляем новый username
                users.push(textAfterCommand);

                // Сохраняем обновленный список в файл
                fs.writeFileSync("usernames.json", JSON.stringify(users, null, 4));

                await ctx.reply(`Username ${textAfterCommand} добавлен в список отслеживаемых.`);
            } catch (error) {
                // Если файла не существует, создаём новый
                if (error instanceof Error && 'code' in error) {
                    const err = error as NodeJS.ErrnoException;
                    if (err.code === "ENOENT") {
                        await fs.promises.writeFile("usernames.json", JSON.stringify([ctx.message.text], null, 4));
                        await ctx.reply(`Username ${ctx.message.text} добавлен в новый список отслеживаемых.`);
                    } else {
                        console.error("Ошибка:", error);
                        await ctx.reply("Произошла ошибка.");
                    }
                } else {
                    // Обработка других ошибок (например, синтаксических)
                    console.error("Неизвестная ошибка:", error);
                    await ctx.reply("Произошла неизвестная ошибка.");
                }
            }
        } else {
            await ctx.reply(`Username не может быть пустым!`);
        }
    });

    composer.command("remove_twitter", async (ctx) => {
        if (ctx.message?.text) {
            try {
                // Получаем текст сообщения
                const fullText = ctx.message.text;

                // Извлекаем текст после команды "remove_twitter" и убираем лишние пробелы
                const command = "remove_twitter";
                const textAfterCommand = fullText.slice(fullText.indexOf(command) + command.length).trim();

                // Проверяем, что текст после команды не пустой
                if (!textAfterCommand) {
                    await ctx.reply("Пожалуйста, укажите имя пользователя после команды.");
                    return;
                }

                // Читаем текущий список пользователей
                const data = fs.readFileSync("usernames.json", "utf8");
                const users: string[] = JSON.parse(data);

                // Проверяем, что username есть в списке отслеживаемых
                if (!users.includes(textAfterCommand)) {
                    await ctx.reply(`Username ${textAfterCommand} отсутствует в списке отслеживаемых.`);
                    return;
                }

                // Удаляем username
                const newArray: string[] = users.filter(value => value !== textAfterCommand);

                // Сохраняем обновленный список в файл
                fs.writeFileSync("usernames.json", JSON.stringify(newArray, null, 4));

                await ctx.reply(`Username ${textAfterCommand} удален из списка отслеживаемых.`);

                console.log(newArray)
            } catch (error) {
                console.error("Неизвестная ошибка:", error);
                await ctx.reply("Произошла неизвестная ошибка.");
            }
        } else {
            await ctx.reply(`Username не может быть пустым!`);
        }
    });

    composer.command("twitters", async (ctx) => {
        try {
            // Читаем файл с пользователями
            const data = fs.readFileSync("usernames.json", "utf-8");
            const users: string[] = JSON.parse(data);

            // Форматируем список
            let response = "📋 Список отслеживаемых аккаунтов Twitter:\n\n";

            if (users.length === 0) {
                response += "Список пуст 🚫\nДобавьте аккаунты с помощью команды /add_twitter";
            } else {
                response += users
                    .map((username, index) => `${index + 1}. @${username}`)
                    .join("\n");

                response += `\n\nВсего аккаунтов: ${users.length} ✅`;
            }

            await ctx.reply(response);

        } catch (error: unknown) {
            // Обработка ошибки отсутствия файла
            if (isErrnoException(error) && error.code === "ENOENT") {
                await ctx.reply("Файл с аккаунтами не найден ❌\nСписок пуст. Добавьте первый аккаунт с помощью /add_twitter");
                return;
            }

            // Обработка других ошибок
            console.error("Ошибка при получении списка:", error);

            let errorMessage = "Произошла ошибка при получении списка ⚠️";
            if (error instanceof Error) {
                errorMessage += `\n${error.message}`;
            }

            await ctx.reply(errorMessage);
        }
    });

    return composer;
}
