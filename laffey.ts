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
} from "./index"

const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

const options: Options = {
    logMessage: true,
    selfListen: false
}

login(user)
    .then(saveCookie)
    .then(listen(handleMessage, options))

function handleMessage(msg: Message, Bot: MessengerApi) {

    //Bot.addReaction(msg.messageId, randomProperty(Reaction))
    Bot.sendTyping(msg.threadId)

    if (msg.text === "ping") {
        Bot.sendMsg("pong", msg.threadId)
        log("send", "pong", " > ", msg.threadId)
    }

    if (msg.text === "change color") {
        const randomColor = randomProperty(Color)
        Bot.changeColor(msg.threadId, randomColor)
    }

    /*


    if (msg.text === "change nickname") {
        Bot.changeNickname(msg.senderId, "uwu", msg.threadId)
        log("send", "Change nickname.")
    }
    */
}

const randomProperty = function (obj: any) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};
