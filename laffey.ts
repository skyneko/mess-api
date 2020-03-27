import { readFileSync } from "fs";
import {
    log,
    login,
    User,
    UserRequestData,
    UploadImage,
    saveCookie,
    Color,
    listen,
    Message,
    Messenger,
    MessengerApi
} from "./src/index"

const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

login(user)
    .then(saveCookie)
    .then((data: UserRequestData) => {
        listen(data, (msg: Message) => hadleMessage(msg, new Messenger(data)))
    })


function hadleMessage(msg: Message, Bot: MessengerApi) {
    log("receive", msg.messageMetadata.actorFbId +" > "+ msg.body)
    if (msg.messageMetadata.actorFbId !== "100041576433270") {

        let threadId: string | number = (msg.messageMetadata.threadKey.threadFbId) ? msg.messageMetadata.threadKey.threadFbId : msg.messageMetadata.threadKey.otherUserFbId
            threadId = parseInt(threadId)

        if (msg.body === "ping") {
            Bot.sendMsg("pong", threadId as number) 
            log("send", "pong", " > ", threadId)
        }

        if (msg.body === "change color") {
            Bot.changeColor(threadId, Color.YELLOW)
            log("send", "Change color thread ", threadId)
        }

        if (msg.body === "sendFile") {
            Bot.sendAttachment("./image.jpg", threadId)
        }

        if (msg.body === "triga") {
            Bot.sendMsg("trigaga", threadId)
            log("send", "triga" + " > " + threadId)
        }

        if (msg.body === "uwu") {
            Bot.sendMsg("owo", threadId)
            log("send", "owo" + " > " + threadId)
        }

        if (msg.body === "sticker")
            Bot.sendSticker(1070107960002293, threadId)
    }
}