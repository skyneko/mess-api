import { readFileSync } from "fs";
import {
    login,
    User,
    UserRequestData,
    saveCookie,
    listen,
    Message,
    Messenger,
    MessengerApi
} from "./src/index"

const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

login(user)
    .then(saveCookie)
    .then((data: UserRequestData) => {
        const bot = new Messenger(data)
        listen(data, (msg: Message) => hadleMessage(msg, new Messenger(data)))
    })


function hadleMessage(msg: Message, Bot: MessengerApi) {
    console.log(msg.messageMetadata.actorFbId, msg.body)
    if (msg.messageMetadata.actorFbId !== "100041576433270") {

        if (msg.body === "ping")
            Bot.sendMsg("pong", parseInt(msg.messageMetadata.threadKey.threadFbId))

        if (msg.body === "uwu")
            Bot.sendMsg("owo", parseInt(msg.messageMetadata.threadKey.threadFbId))
    }
}