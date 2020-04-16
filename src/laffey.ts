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
    Reaction,
    UserRequestData,
    Messenger
} from "./index"

const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

const options: Options = {
    logMessage: true,
    selfListen: false
}

login(user)
    .then(saveCookie)
    .then(beforeListen)
    .then(listen(handleMessage, options))

function handleMessage(msg: Message, Bot: MessengerApi) {


    if (msg.text === "ping") {
        Bot.sendMsg("pong", msg.threadId)
        // log("send", "pong", " > ", msg.threadId)
    }

    if (msg.text === "change color") {

        Bot.changeColor(msg.threadId, randomProperty(Color))
    }

}

async function beforeListen(data: UserRequestData) {
    const Bot = new Messenger(data)

    Bot.sendAttachment("./files/Untitled Project3.mp4", 2252600751432999, console.log)

    return data
}

const randomProperty = function (obj: any) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};
