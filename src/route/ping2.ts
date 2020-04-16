import { MessengerApi } from "../messenger"
import { Message } from "../mqttListen"

export default function (command: string, msg: Message,Bot: MessengerApi): void {
 
    if (command === "test") {
        Bot.sendMsg("test.", msg.threadId)
    } 

}