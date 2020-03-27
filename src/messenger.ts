import request, { Response } from "request"
import { createHeader, log, UserRequestData, getUIDFromCookie, getRandomInt, isUserID } from "./utils"
const qs = require("qs")

export interface MessengerApi {
    sendMsg(message: string, thread_id: number): void
}

export class Messenger {
    private uid: number
    private cookie: string
    private fbDtsg: string

    constructor(data: UserRequestData) {
        this.uid = getUIDFromCookie(data.cookie)
        this.cookie = data.cookie
        this.fbDtsg = data.fbDtsg
    }

    public sendMsg(message: string, threadId: number) {
        const messageId = this.getMessageId()

        let dataString: string = qs.stringify({
            ...{
                client: 'mercury',
                action_type: 'ma-type:user-generated-message',
                body: message,
                ephemeral_ttl_mode: '0',
                has_attachment: 'false',
                message_id: messageId,
                offline_threading_id: messageId,
                signature_id: '118b0d7a',
                source: 'source:chat:web',
                tags: ['web:trigger:fb_header_dock:jewel_thread'],
                thread_fbid: threadId,
                timestamp: Date.now(),
                ui_push_phase: 'C3',
            },
            ...this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"])
        })

        
        if (isUserID(threadId)) dataString = dataString.replace("&thread_fbid=", "&other_user_fbid=")
 
        request({
            uri: "https://www.facebook.com/messaging/send/",
            headers: createHeader(this.cookie),
            method: "POST",
            body: dataString
        }, (err: Error, resp: Response, body: any) => {
            this.handleResponse(body)
        })
    }

    public sendSticker() {
        
    }

    private handleResponse(response: string): void {
        // @ts-ignore
        console.log(this.parseResponse(response).payload.actions[0].message_id)
    }

    private parseResponse(response: string): object {
        if (response.indexOf("for (;;);") === 0)
            return JSON.parse(response.slice(9, response.length))
        else
            return { "message": response }
    }

    private getMessageId() {
        return '6616916' + getRandomInt(1, 1000000000000);
    }

    private createRequestData(requireKey: Array<string>): object {
        let dataStringObj: any = {}

        if (requireKey.includes("__user")) dataStringObj["__user"] = this.uid
        if (requireKey.includes("__a")) dataStringObj["__a"] = "1"
        if (requireKey.includes("__dyn")) dataStringObj["__dyn"] = "7AgNeS4amaAxd2u6aJGeFxqeCwKyaF3oyfiheC263GdwIhE98nyUdUaofVUnnyocWwADKaxeUW2y4E4eczobrCCwVxCuifz8nxm1Dxa2m4oqwi88UsBwWG0HFVo762Su4pEtxy5Urx244U4mm2"
        if (requireKey.includes("__csr")) dataStringObj["__csr"] = ""
        if (requireKey.includes("__req")) dataStringObj["__req"] = "3b"
        if (requireKey.includes("__beoa")) dataStringObj["__beoa"] = "0"
        if (requireKey.includes("__pc")) dataStringObj["__pc"] = "PHASED:DEFAULT"
        if (requireKey.includes("dpr")) dataStringObj["dpr"] = "1"
        if (requireKey.includes("__rev")) dataStringObj["__rev"] = "1001570654"
        if (requireKey.includes("__s")) dataStringObj["__s"] = "ok7cvo:e1w16s:nfe80r"
        if (requireKey.includes("__hsi")) dataStringObj["__hsi"] = "6775709947171360355-0"
        if (requireKey.includes("fb_dtsg")) dataStringObj["fb_dtsg"] = this.fbDtsg
        if (requireKey.includes("jazoest")) dataStringObj["jazoest"] = "22018"
        if (requireKey.includes("__spin_r")) dataStringObj["__spin_r"] = "1001570654"
        if (requireKey.includes("__spin_b")) dataStringObj["__spin_b"] = "trunk"
        if (requireKey.includes("__spin_t")) dataStringObj["__spin_t"] = "1577592516"

        return dataStringObj
    }
}