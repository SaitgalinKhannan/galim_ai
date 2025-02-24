import { Scraper } from "agent-twitter-client";
import { Cookie } from "tough-cookie";
import { promises as fs } from 'fs';

const username = "ai_galim88001";
const password = "Lisunsin1";
const email = "sait05khan@gmail.com";

const scraper = new Scraper();

const loadCookies = async () => {
    try {
        const data = await fs.readFile('./cookies.json', 'utf8');
        const cookies = JSON.parse(data);
        return cookies.map((cookieObj: Cookie) => Cookie.fromJSON(cookieObj)?.toString());
    } catch (error) {
        console.log('No cookies file found or error reading file.');
        return null;
    }
};

const loginWithCookies = async () => {
    console.log('Trying to login with cookies');
    const cookies = await loadCookies();
    if (cookies) {
        await scraper.setCookies(cookies);
        if (await scraper.isLoggedIn()) {
            console.log('Logged in successfully with cookies');
            return true;
        } else {
            console.log('Failed to login with cookies');
        }
    }
    return false;
};

const loginWithCredentials = async () => {
    console.log('Trying to login with username and password');
    await scraper.login(username, password, email);
    if (await scraper.isLoggedIn()) {
        const cookies = await scraper.getCookies();
        await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));
        console.log('Logged in successfully with credentials');
        return true;
    } else {
        console.log('Failed to login with credentials');
    }
    return false;
};

export const login = async () => {
    const loggedInWithCookies = await loginWithCookies();
    if (!loggedInWithCookies) {
        await loginWithCredentials();
    }
    return scraper; // Возвращаем авторизованный экземпляр scraper
};