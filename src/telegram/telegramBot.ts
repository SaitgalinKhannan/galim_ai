import {Api, Bot, BotError, Context, GrammyError, HttpError} from "grammy";
import {Scraper} from "agent-twitter-client";
import {createTwitterComposer} from "./commands";
import {scheduleTweetFetching} from "../x/getTweets";
import {bot, sanitizedConfig} from "../main";

// const botToken = "8188164028:AAE3S8B0SsUa5vUJjrTVefI9hqE4YauWkfs";


const startBot = async (scraper: Scraper, bot: Bot<Context, Api>) => {
    // error handler
    bot.catch((err: BotError) => {
        const ctx = err.ctx;
        console.error(`Error while handling update ${ctx.update.update_id}:`);
        const e = err.error;
        if (e instanceof GrammyError) {
            console.error("Error in request:", e.description);
        } else if (e instanceof HttpError) {
            console.error("Could not contact Telegram:", e);
        } else {
            console.error("Unknown error:", e);
        }
    });

    console.log('Starting Telegram bot...');
    await bot.init();

    await bot.api.setMyCommands([
        { command: "start", description: "Start the bot" },
        { command: "twitters", description: "Usernames list" },
        { command: "add_twitter", description: "Add username to sniping" },
        { command: "remove_twitter", description: "Remove username from sniping"}
    ]);

    bot.use(createTwitterComposer())

    bot.start();
    scheduleTweetFetching(scraper);
};

export default startBot;