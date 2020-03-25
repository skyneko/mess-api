import { login, User, UserRequestData, saveCookie, getUIDFromCookie, listen, Message } from "./src/index"
import { readFileSync } from "fs";

const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

login(user)
    .then(saveCookie)
    .then((data: UserRequestData) => {
        listen(data, (msg: Message) => { console.log(msg.messageMetadata.actorFbId, msg.body) })
    })
