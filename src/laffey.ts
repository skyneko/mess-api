import { readFileSync } from "fs";
import {
    log,
    login,
    saveCookie,
    listen,
    wait1,
    User,
    Color,
    Message,
    Options,
    MessengerApi,
    Reaction,
    UserRequestData,
    Messenger
} from "./index"

interface TextMessage extends Message {
    text: string
}

interface AttachmensMessage extends Message {
    attachments: Array<{
        type: string,
        id: string,
        filename: string,
        filesize: string,
        width: number,
        height: number,
        preview: {
            preview:string,
            large_preview:  string,
            thumbnail: string
        },
        extension: string,
        renderAsSticker: false
    }>    
}

interface StickerMessage extends Message {
    stickerId: number,
    pack:  string,
    label: string,
    frameCount: number,
    image: {
        spriteImage: string | null,
        url: string,
        width: number,
        height: number
    }
}

// ==== import features modules ==== //
import ping2 from "./route/ping2"
import addUser from "./route/addUser"

// ==== user config ==== // 
const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

const options: Options = {
    logMessage: true,
    selfListen: false
}

login(user)
    .then(saveCookie)
    .then(beforeListen)
    .then(listen(handleMessage, options))

function handleMessage(message: any, Bot: MessengerApi) {


    // ==== route ==== //

    if (message.type === "text") {
        let msg : TextMessage = message;

        msgOn(">ping", () => {
            Bot.sendMsg("pong", msg.threadId)
        })
    
        msgOn(">uwu", () => {
            Bot.sendAttachment("./files/uwu.jpg", msg.threadId)
        })
    
        msgOn(">ping2", ping2, false)
        msgOn(">addUser", addUser, false)    


        // ==== function ==== //
        function msgOn(key: string, callback: Function, mode: boolean = true): void {
            if (mode) {
                if (msg.text === key) {

                    // send typing
                    Bot.sendTyping(msg.threadId)
                    wait1(() => callback()) 
                }
            }
            else {
                if (msg.text.indexOf(key) === 0) {
                    
                    const command: string = msg.text.slice(key.length, msg.text.length).trim()

                    // send typing
                    Bot.sendTyping(msg.threadId)
                    wait1(() => callback(command, msg, Bot))
                }    
            }

        }
    }

    // Attachments
    if (message.type === "attachments") {
        let msg: AttachmensMessage = message

        // something
        console.log(msg)
    }

    // Sticker
    if (message.type === "sticker") {
        let msg: StickerMessage = message

        // something
        console.log(msg)
    }
    
}

async function beforeListen(data: UserRequestData) {
    const Bot = new Messenger(data)

    //Bot.sendAttachment("./files/backnumber.mp3", 2252600751432999, console.log)

    return data
}