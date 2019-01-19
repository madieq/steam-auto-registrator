import path from 'path'
export default class Config {
    static WINDOW_CONFIG = {
        height: 250,
        width: 1000,
    }
    static TEMP_MAIL_KEY = 'wayd71231FE2378f'
    static DOMAIN_MAIL = 'movierate.info'
    static LOGIN_LENGTH = 15
    static PASSWORD_LENGTH = 20
    static MAIL_LENGTH = 15
    static CACHE_FILE = './cache.json'
    static DEFAULT_PATH_ACCOUNTS = path.join("./", "steam_accounts.txt");
}