export interface ENV {
    BOT_TOKEN: string | undefined;
    OPEN_AI_KEY: string | undefined;
    USERNAME: string | undefined;
    PASSWORD: string | undefined;
    EMAIL: string | undefined;
}

export interface Config {
    BOT_TOKEN: string;
    OPEN_AI_KEY: string;
    USERNAME: string;
    PASSWORD: string;
    EMAIL: string;
}

export const getSanitizedConfig = (config: ENV): Config => {
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined) {
            throw new Error(`Missing key ${key} in config.env`);
        }
    }
    return config as Config;
};