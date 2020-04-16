import { Message } from "../mqttListen"
import { MessengerApi } from "../messenger"
import { isIntString, log, wait1 } from "../utils"

export default function (command: string, msg: Message, Bot: MessengerApi): void {
   
    if (isIntString(command) === false) {

        Bot.sendMsg("Id không hợp lệ.", msg.threadId)
        wait1( () => Bot.sendMsg("*câu lệnh:*\n>addUser [userId]", msg.threadId))

        return
    }

    const targetID: number = parseInt(command)

    Bot.addUser(targetID, msg.threadId)

    // log 
    log("info", "Add user:", targetID)
}