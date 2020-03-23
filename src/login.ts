import { post, Response } from "request"
import { readFileSync, existsSync } from "fs"
import qs from "querystring";
import { createHeader } from "./utils"

const cookiePath: string = "../user/cookie.json"

export interface User {
    username: string,
    password: string
}

export interface UserRequestData {
    "cookie": string,
    "fb-dtsg": string,
}

function createDataString (user: User):string {
    return qs.stringify({
        jazoest: "2754",
        lsd: "AVrsdFeg",
        email: user.username,
        pass: user.password,
        timezone: "-420",
        lgndim: "eyJ3IjoxMzY2LCJoIjo3NjgsImF3IjoxMzY2LCJhaCI6NzM4LCJjIjoyNH0=",
        lgnrnd: "073905_ABHb",
        lgnjs: "1577201948",
        ab_test_data: "AAAAAAP/AfvAAAPPPAAAAAAAAAAAAAAAAAAAAAAAAMZ/ZZMZAAHAAB",
        locale: "vi_VN",
        next: "https://www.facebook.com/",
        login_source: "login_bluebar",
        guid: "f1f81b2b5dc33cc",
        prefill_contact_point: user.username,
        prefill_source: "browser_dropdown",
        prefill_type: "contact_point",
        skstamp: "eyJoYXNoIjoiZmViZWFmNDU4MjBhNDAyMjQ5ZmM0NDNjOTQ2ZTg1ZjEiLCJoYXNoMiI6ImI0ZDcxZGU1MjMwNDEzYjk4ZTUwMzM2YjA3ZTQ5YjYxIiwicm91bmRzIjo1LCJzZWVkIjoiZmYwMzBiMjA0OWE1MGVmNGQxOTAwMzE3MmRkMWZjNmQiLCJzZWVkMiI6IjEwN2Q3NGVkZDY2YTM1Y2ZkZmI1Yzc1MWVhYTM0NWQ0IiwidGltZV90YWtlbiI6MjA1MDAwLCJzdXJmYWNlIjoibG9naW4ifQ=="
    });
}

export function login(user: User): Promise<UserRequestData> {
    return new Promise((resolve) => {

        /** kiem tra file cookie.json, neu khong co thi tao cookie moi uwu */
        if (existsSync(cookiePath)) {
            const userData: UserRequestData = JSON.parse(readFileSync(cookiePath, "utf-8"))
            resolve(userData)
        }

        const loginBaseUrl: string = "https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=110"

        post({
            uri: loginBaseUrl,
            headers: createHeader()
        }, (err: Error, resp: Response, html: string): void => {
            if (err) return console.log(err)
            if (!resp.headers["set-cookie"]) return console.log("headers['set-cookie'] 1 is undefined!")
            
            let cookie: string = resp.headers["set-cookie"].map(key => key.split("; ")[0]).join("; ")

            post({
                uri: loginBaseUrl,
                headers: createHeader(cookie),
                body: createDataString(user)
            }, (err: Error, resp: Response, html: string): void => {
                if (err) return console.log(err)
                if (!resp.headers["set-cookie"]) return console.log("headers['set-cookie'] 2 is undefined!")
                
                cookie = resp.headers["set-cookie"].map(key => key.split("; ")[0]).join("; ")
                
                if (cookie.lastIndexOf("sfau=") > -1) return console.log("invalid username or password.")
                console.log(cookie)
            })
        })

        console.log("goodbye world")
    })

}
