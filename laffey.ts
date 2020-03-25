import { login, User, UserRequestData, saveCookie, getUIDFromCookie, listen } from "./src/index"
import { readFileSync } from "fs";

const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

login(user)
    .then(saveCookie)
    .then((data: UserRequestData) => {
        listen(data)
    })
