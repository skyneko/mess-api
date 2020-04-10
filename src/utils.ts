
export interface Headers {
    "User-Agent": string,
    "Accept"?: string,
    "Accept-Language"?: string,
    "Referer"?: string,
    "Content-Type"?: string,
    "Origin"?: string,
    "DNT": number,
    "Connection"?: string,
    "Upgrade-Insecure-Requests": number,
    "Cookie": string
}

export interface User {
    username: string,
    password: string
}

export interface UserRequestData {
    "cookie": string,
    "fbDtsg": string,
    "xhpcComposerid": string,
    "composerSessionId": string,
    "ftEntIdentifier": string,
    "revision": string,
    "irisSeqID": string,
    "rootid": string,
    "sessionId": string
}

export interface UploadImage {
    image_id: number,
    filename: string,
    filetype: string,
    src: string,
    fbid: number
}

export let Color = {
    RED: 2129984390566328,
    AQUA_BLUE: 2870764842974700,
    MANGO: 2870764842974700,
    YELLOW:  174636906462322 ,
    CANDY: 205488546921017,
    CITRUS: 370940413392601,
    BERRY: 164535220883264,
    AQUA: 417639218648241,
}

export let Reaction = {
    FACE_HEART: "😍",
    ANGRY: "😆",
    LOVE: "❤",
    SAD: "😢",
    LIKE: "👍",
    DISLIKE: "👎"
}

export function createHeader(cookie: string = "", userAgent?: string): Headers {
    if (!userAgent) userAgent = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:72.0) Gecko/20100101 Firefox/72.0"
    /** Remove spaces */
    cookie = cookie.trim()

    return {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.facebook.com/",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://www.facebook.com",
        "DNT": 1,
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": 1,
        "Cookie": cookie
    }
}


export function getFromHTML(str: string, startToken: string, endToken: string): string {
    var start = str.indexOf(startToken) + startToken.length;
    if (start < startToken.length) return "";

    var lastHalf = str.substring(start);
    var end = lastHalf.indexOf(endToken);
    if (end === -1) {
        throw Error(
            "Could not find endTime `" + endToken + "` in the given string."
        );
    }
    return lastHalf.substring(0, end);
}

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getUIDFromCookie(cookie: string): number {

    for (let e of cookie.split("; ")) {
        if (e.indexOf("c_user=") > -1) {
            return parseInt(e.split("=")[1])
        }
    }

    log("warn", "User id not found.")
    return 0
}

export function getFileType(filename: string) {

    let file_ext = filename.slice(filename.length - 3, filename.length);

    if (file_ext === "png" || file_ext === "jpg") return "image";
    if (file_ext === "mp3") return "audio";

    return "file";
}

export function isUserID(id: number) {
    return id.toString().indexOf("1000") === 0
}


export function log(type: string, ...text: Array<string|number>): void {
    const maxLength = 65
    let line = text.join("")
    if (line.length > maxLength) line = line.slice(0, maxLength) + "... "

    if (type === "info") console.log("\x1b[32m", "[LOG]:", "\x1b[0m", line)
    if (type === "warn") console.log("\x1b[31m", "[WARN]:", "\x1b[0m", line)
    if (type === "error") console.log("\x1b[41m" + "[ERROR]:" + "\x1b[0m", line)
    if (type === "receive") console.log("\x1b[34m" + "[R]:" + "\x1b[0m", line.replace(">", "\x1b[35m"+">"+ "\x1b[0m"))
    if (type === "send") console.log("\x1b[33m" + "[S]:" + "\x1b[0m", line.replace(">", "\x1b[35m"+">"+ "\x1b[0m"))
}
