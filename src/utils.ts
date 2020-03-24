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

export function createHeader(cookie: string = "", userAgent?:string): Headers {
    if (!userAgent) userAgent = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0"

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


export function getFromHTML (str: string, startToken: string, endToken: string): string {
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

export function log(type: string, text: string): void {
    if (type === "info") console.log("\x1b[32m","[LOG]:","\x1b[0m",text)
    if (type === "warn") console.log("\x1b[31m","[WARN]:","\x1b[0m",text)
    if (type === "error") console.log("\x1b[41m"+"[ERROR]:"+"\x1b[0m",text) 
}