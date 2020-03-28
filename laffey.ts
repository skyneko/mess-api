import { readFileSync } from "fs";
import {
    log,
    login,
    saveCookie,
    listen,
    User,
    Color,
    Message,
    Options,
    MessengerApi,
    Reaction
} from "./src/index"

const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

const options: Options = {
    logMessage: true,
    selfListen: false,
    inThread: false
}

login(user)
    .then(saveCookie)
    .then(listen(handleMessage, options))

function handleMessage(msg: Message, Bot: MessengerApi) {

    Bot.addReaction(msg.messageId, Reaction.SAD)

    if (msg.text === "ping") {
        Bot.sendMsg("pong", msg.threadId)
        log("send", "pong", " > ", msg.threadId)
    }
    
    if (msg.text === "remove user") {
        Bot.removeUser(100009854073587, msg.threadId)
        log("send", "Remove user.")
    }

    if (msg.text === "add user") {
        Bot.addUser(100009854073587, msg.threadId)
        log("send", "Add user.")
    }

    if (msg.text === "change nickname") {
        Bot.changeNickname(msg.senderId, "uwu", msg.threadId)
        log("send", "Change nickname.")
    }

    if (msg.text === "change name") {
        Bot.changeGroupName(msg.threadId, "owo")
        log("send", "Change thread name.")
    }

    if (msg.text === "reaction") {
        Bot.addReaction(msg.messageId, Reaction.SAD)
        log("send", "Set reaction.")
    }

    if (msg.text === "change color") {
        Bot.changeColor(msg.threadId, Color.YELLOW)
        log("send", "Change color thread ", msg.threadId)
    }

    if (msg.text === "sendFile") {
        Bot.sendAttachment("./image.jpg", msg.threadId)
    }

    if (msg.text === "triga") {
        Bot.sendMsg("trigaga", msg.threadId)
        log("send", "triga" + " > " + msg.threadId)
    }

    if (msg.text === "uwu") {
        Bot.sendMsg("owo", msg.threadId)
        log("send", "owo" + " > " + msg.threadId)
    }

    if (msg.text === "sticker")
        Bot.sendSticker(1070107960002293, msg.threadId)


}