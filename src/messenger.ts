import request, { Response } from "request"
import { createHeader, log, UserRequestData, getUIDFromCookie, getRandomInt, isUserID, UploadImage, getFileType } from "./utils"
import { createReadStream, existsSync } from "fs"
const qs = require("qs")

export interface MessengerApi {
    /**
     * Gửi tin nhắn đến một nhóm hoặc user chỉ dịnh.
     * @param message Nội dung.
     * @param threadId Id nhóm/user.
     * @param callback callback.
     */
    sendMsg(message: string, threadId: number, callback?: Function): void
    /**
     * Gửi sticker .
     * @param stickerId Id sticker.
     * @param threadId Id nhóm/user.
     * @param callback callback.
     */
    sendSticker(stickerId: number, threadId: number, callback?: Function): void
    /**
     * Gửi typing (đang gõ).
     * @param threadId Id nhóm/user.
     * @param callback callback.
     */
    sendTyping(threadId: number, callback?: Function): void

    /**
     * Tải một file lên facebook và trả về id.
     * @param filePath Đường dẫn file.
     * @return File id.
     */
    uploadFile(filePath: string): Promise<UploadImage>

    /**
     * Gửi lên một file ảnh (jpg/png), video (mp4), audio (mp3).
     * @param filePath Đường dẫn file.
     * @param threadId Id nhóm/user.
     * @param callback callback.
     */
    sendAttachment(filePath: string, threadId: number, callback?: Function): void

    /**
     * Đổi màu cuộc trò chuyện.
     * @param threadId Id nhóm/user.
     * @param colorId colorId
     * @param callback callback.
     */
    changeColor(threadId: number, colorId: number, callback?: Function): void

    /**
     * Thêm biểu tượng cảm xúc vào tin nhắn.
     * @param messageId Id tin nhắn.
     * @param reaction emoji: https://emojipedia.org/facebook/
     * @param callback callback
     */
    addReaction(messageId: string, reaction: string, callback?: Function): void

    /**
     * Đổi tên cuộc trò chuyện.
     * @param threadId Id nhóm/user.
     * @param name tên mới.
     * @param callback callback
     */
    changeGroupName(threadId: number, name: string, callback?: Function): void

    changeNickname(userId: number, nickname: string, threadId: number, callback?: Function): void

    addUser(userId: number, threadId: number, callback?: Function): void

    removeUser(userId: number, threadId: number, callback?: Function): void

    getUserInfo(): void

    uid: number
}

interface ResponseData {
    __ar?: number,
    payload: {
        metadata?: Array<UploadImage>
    },
    bootloadable?: object,
    ixData?: object,
    bxData?: object,
    gkxData?: object,
    qexData?: object,
    lid?: string
}

export class Messenger {
    public uid: number
    private cookie: string
    private fbDtsg: string

    constructor(data: UserRequestData) {
        this.uid = getUIDFromCookie(data.cookie)
        this.cookie = data.cookie
        this.fbDtsg = data.fbDtsg
    }

    public sendMsg(message: string, threadId: number, callback: Function = () => null) {
        log("send", "pong", " > ", threadId)

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

        this.post(dataString, "https://www.facebook.com/messaging/send/", callback)
    }

    public sendSticker(stickerId: number, threadId: number, callback: Function = () => null) {
        const messageId = this.getMessageId()

        let dataString: string = qs.stringify({
            ...{
                client: "mercury",
                action_type: "ma-type:user-generated-message",
                ephemeral_ttl_mode: "0",
                has_attachment: "true",
                message_id: messageId,
                offline_threading_id: messageId,
                source: "source:titan:web",
                sticker_id: stickerId,
                thread_fbid: threadId,
                timestamp: Date.now(),
                ui_push_phase: "C3",
            },
            ...this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"])
        })

        if (isUserID(threadId)) dataString = dataString.replace("&thread_fbid=", "&other_user_fbid=")

        this.post(dataString, "https://www.facebook.com/messaging/send/", callback)
    }

    public sendTyping(threadId: number, callback: Function = () => null) {
        let dataString: string = qs.stringify({
            ...{
                typ: '1',
                to: '',
                source: 'mercury-chat',
                thread: threadId,
            },
            ...this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"])
        })

        this.post(dataString, "https://www.facebook.com/ajax/messaging/typ.php", callback)
    }

    public sendAttachment(filePath: string, threadId: number, callback: Function = () => null): void {
        const messageId = this.getMessageId()
        const filename: string = filePath.slice(filePath.lastIndexOf("/") + 1, filePath.length)

        this.uploadFile(filePath)
            .then((image: UploadImage) => {

                let data: object = {
                    ...{
                        client: 'mercury',
                        action_type: 'ma-type:user-generated-message',
                        ephemeral_ttl_mode: '0',
                        has_attachment: 'true',
                        message_id: messageId,
                        offline_threading_id: messageId,
                        signature_id: '42458c2d',
                        source: 'source:chat:web',
                        tags: ['web:trigger:fb_header_dock:jewel_thread'],
                        thread_fbid: threadId,
                        timestamp: '1577794588307',
                        ui_push_phase: 'C3',
                    },
                    ... this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"])
                }

                //@ts-ignore
                data[getFileType(filename) + "_ids"] = [image[getFileType(filename) + "_id"]]

                let dataString = qs.stringify(data)

                if (isUserID(threadId)) dataString = dataString.replace("&thread_fbid=", "&other_user_fbid=")
                console.log(data)
                this.post(dataString, "https://www.facebook.com/messaging/send/", callback)
            })
    }

    public uploadFile(filePath: string): Promise<UploadImage> {

        const filename: string = filePath.slice(filePath.lastIndexOf("/") + 1, filePath.length)
        let headers: any = createHeader(this.cookie)
        headers["Content-Type"] = 'multipart/form-data; boundary=---------------------------11227507362007673615787878216'
        headers["X-MSGR-Region"] = 'ATN'

        return new Promise((resolve) => {

            if (!existsSync(filePath)) return log("warn", "Không tìm thấy file upload.")

            const dataString = qs.stringify({
                ...this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"]),
                ... { ft: { tn: '+M' } }
            })

            const formData: any = {
                "Content-Disposition": 'form-data',
                name: 'upload_1030',
                filename: filename,
                my_file: createReadStream(filePath),
            }
            if (getFileType(filename) === "audio") formData["voice_clip"] = "true";

            request({
                url: 'https://upload.facebook.com/ajax/mercury/upload.php?' + dataString,
                formData: formData,
                method: 'POST',
                headers: headers
            }, (err: Error, resp: Response, body: any) => {
                if (err) return log("warn", "File upload failed.")
                let data = this.parseResponse(body)

                if (data.payload !== {} && data.payload.metadata)
                    resolve(data.payload.metadata[0])
                else
                    log("warn", "File upload failed.")
            })
        })
    }

    public changeColor(threadId: number, colorId: number, callback: Function = () => null): void {
        const dataString = qs.stringify({
            ...this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"]),
            ... {
                queries: JSON.stringify({
                    "o0": {
                        "doc_id": "1727493033983591",
                        "query_params": {
                            "data": {
                                "client_mutation_id": "0",
                                "actor_id": this.uid,
                                "thread_id": threadId,
                                "theme_id": colorId,
                                "source": "SETTINGS"
                            }
                        }
                    }
                })
            }
        })

        this.post(dataString, "https://www.facebook.com/api/graphqlbatch/", callback)
    }


    public addReaction(messageId: string, reaction: string, callback: Function = () => null): void {

        if (
            reaction !== "😍"
            && reaction !== "😆"
            && reaction !== "😮"
            && reaction !== "😢"
            && reaction !== "😠"
            && reaction !== "👍"
            && reaction !== "👎"
            && reaction !== "❤"
        ) {
            return log("warn", "inval reaction: " + reaction);
        }

        const dataString: string = qs.stringify(
            this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"])
        )

        const query: string = qs.stringify({
            doc_id: '1491398900900362',
            variables: JSON.stringify({
                data:
                {
                    client_mutation_id: '0',
                    actor_id: this.uid,
                    action: 'ADD_REACTION',
                    message_id: messageId,
                    reaction: reaction
                }
            })
        })

        this.post(dataString, "https://www.facebook.com/webgraphql/mutation?" + query, callback)
    }

    public changeGroupName(threadId: number, name: string, callback: Function = () => null): void {
        if (isUserID(threadId)) return log("warn", "Chỉ có thể đổi tên cho group.")

        const dataString = qs.stringify({
            ...this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"]),
            ... {
                thread_id: threadId,
                thread_name: name,
            }
        })

        this.post(dataString, "https://www.facebook.com/messaging/set_thread_name/", callback)
    }

    public changeNickname(userId: number, nickname: string, threadId: number, callback: Function = () => null): void {
        const dataString = qs.stringify({
            ...this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"]),
            ... {
                request_user_id: this.uid,
                thread_or_other_fbid: threadId,
                participant_id: userId,
                nickname: nickname,
            }
        })

        this.post(dataString, "https://www.facebook.com/messaging/save_thread_nickname/?source=thread_settings", callback)
    }

    public addUser(userId: number, threadId: number, callback: Function = () => null): void {
        if (isUserID(threadId)) return log("warn", "Chỉ có thể sử dụng trong group.")

        const messageId = this.getMessageId()

        let dataString: string = qs.stringify({
            ...{
                client: "mercury",
				action_type: "ma-type:log-message",
				ephemeral_ttl_mode: "0",
				"log_message_data[added_participants][0]": "fbid:"+userId,
				log_message_type: "log:subscribe",
				message_id: messageId,
				offline_threading_id: messageId,
				source: "source:titan:web",
				thread_fbid: threadId,
				timestamp: Date.now(),
            },
            ...this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"])
        })

        this.post(dataString, "https://www.facebook.com/messaging/send/", callback)
    }

    public removeUser(userId: number, threadId: number, callback: Function = () => null): void {
        if (isUserID(threadId)) return log("warn", "Chỉ có thể sử dụng trong group.")

        const dataString: string = qs.stringify(
            this.createRequestData(["__user", "__a", "__dyn", "__pc", "dpr", "__rev", "__s", "__hsi", "__comet_req", "fb_dtsg"])
        )

        const query: string = qs.stringify({
                uid: userId,
                tid: threadId
        })

        this.post(dataString, "https://www.facebook.com/chat/remove_participants/?" + query, callback)
    }

    public getUserInfo(): void {

    }

    /**
     * Xử lý sau khi POST data.
     * @param response
     * @param callback
     */
    private handleResponse(response: string, callback: Function): void {
        callback(this.parseResponse(response))
    }

    /**
     * Giải mã data trả về
     * @param response
     */
    private parseResponse(response: string): ResponseData {
        if (response.indexOf("for (;;);") === 0)
            return JSON.parse(response.slice(9, response.length))
        else
            return { payload: {} }
    }

    /**
     * Post lên facebook, sử dụng datastring.
     * @param dataString
     * @param url
     * @param callback
     */
    private post(dataString: string, url: string, callback: Function) {

        request({
            uri: url,
            headers: createHeader(this.cookie),
            method: "POST",
            body: dataString
        }, (err: Error, resp: Response, body: any) => {
            this.handleResponse(body, callback)
        })
    }

    /**
     * Trả về một id ngẫu nhiên
     */
    private getMessageId() {
        return '6616916' + getRandomInt(1, 1000000000000)
    }

    /**
     * Tạo một object bao gồm các key thường dùng khi gửi yêu cầu lên messenger.
     * @param requireKey Các key sử dụng.
     */
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
