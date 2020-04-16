import { UserRequestData, getUIDFromCookie, log } from "./utils"
import mqtt, { PacketCallback, OnMessageCallback } from "mqtt"
import { refreshPage } from "./login"
import websocket from "websocket-stream"
import { Messenger } from "./messenger"

export interface Message {
    threadId: number,
    isGroup: boolean,
    senderId: number,
    text: string,
    messageId: string
}

interface MessageEvent {
    deltas: Array<object>,
    firstDeltaSeqId: number,
    lastIssuedSeqId: number,
    queueEntityId: number
}

export interface Options {
    userAgent?: string,
    logMessage?: boolean,
    selfListen?: boolean
}

let options: Options
let uid: number
let uData: UserRequestData

/**
 * Tạo mảng messageId để lưu các id tin nhắn trước đó. Sau khi listen
 * sẽ kiểm tra trong mảng này, nếu không trùng thì mới tiếp tục thực hiện @callback.
 * @see line 200.
 */
let lastMessageId: Array<string> = new Array(100).fill("")

/** khoảng thời gian mỗi lần refresh trang. */
const loopTime: number = 10 * 1000

export function listen( callback: Function, opts: Options = {}): any {
    return function (data: UserRequestData):void {
        if (opts) options = opts

        let userAgent: string = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:72.0) Gecko/20100101 Firefox/72.0"
        if (options.userAgent) userAgent = options.userAgent

        const sessionID: number = Math.floor(Math.random() * 9007199254740991) + 1
        let { irisSeqID, cookie } = uData = data

        /** lấy user id từ cookie */
        uid = getUIDFromCookie(cookie)

        /** Remove spaces */
        cookie = cookie.trim()

        /** MQtt */
        const websocket_client_url = "wss://edge-chat.facebook.com:443/chat?region=prn&sid=" + sessionID;

        const mqttOptions: object = {
            protocol: 'wss',
            slashes: true,
            auth: null,
            host: 'edge-chat.facebook.com',
            port: null,
            hostname: 'edge-chat.facebook.com',
            hash: null,
            search: '?region=prn&sid=' + sessionID,
            query: { region: 'prn', sid: sessionID },
            pathname: '/chat',
            path: '/chat?region=prn&sid=' + sessionID,
            href: 'wss://edge-chat.facebook.com/chat?region=prn&sid=' + sessionID,
            clientId: 'mqttwsclient',
            protocolId: 'MQIsdp',
            protocolVersion: 3,
            username: JSON.stringify({
                u: uid,
                s: sessionID,
                cp: 3,
                ecp: 10,
                chat_on: true,
                fg: false,
                d: getGUID(),
                ct: 'websocket',
                mqtt_sid: '',
                aid: 219994525426954, // messenger app id
                st: [],
                pm: [],
                dc: '',
                no_auto_fg: true,
                gas: null,
                pack: []
            }),
            defaultProtocol: 'wss'
        }

        const websocketOptions: object = {
            'headers': {
                'Cookie': cookie,
                'Origin': 'https://www.facebook.com',
                'User-Agent': userAgent,
                'Referer': 'https://www.facebook.com',
            },
            origin: 'https://www.facebook.com',
            protocolVersion: 13
        }

        /** Đếm số lần refresh trang */
        let requestCount = 0

        function connectMqttServer() {
            refreshPage(cookie)
                .then((data: UserRequestData) => {
                    // log("info", "refresh page ... "+ data.irisSeqID)
                    const client = new mqtt.Client(() => websocket(websocket_client_url, undefined, websocketOptions), mqttOptions)
                    // const irisSeqID = (requestCount > 1) ? data.irisSeqID + ++requestCount : data.irisSeqID
                    const irisSeqID = data.irisSeqID

                    client.on("error", clientOnError)
                    client.on("connect", clientOnConnect(client, uid, irisSeqID))
                    client.on("message", clientOnMessage(callback))
                })
        }

        /**
         * - Kết nối server chat. -
         * Sau khoảng 1 thời gian nhất định, data sẽ được refresh và kết nối lại
         */
        setTimeout(() => {
            log("info", "Listen ... ")
        }, loopTime);
        // loop
        setInterval(connectMqttServer, loopTime)

    }

}

/**
 * Xử lý lỗi khi connect mqtt.
 */
function clientOnError(err: Error): void {
    log("error", "WebSocket connection failed.")
}

/**
 * Xử lý khi sau khi connect server chat.
 *
 * @param irisSeqID id này cũng chả biết là gì nhưng nó sẽ trỏ đến tin nhắn
 *  gần nhất khi connect. Facebook sẽ check cái này nên nếu thiếu sẽ
 *  bị lỗi “ERROR_QUEUE_OVERFLOW”
 */
function clientOnConnect(client: any, uid: number, irisSeqID: string): Function {
    return function (): void {
        client.subscribe(["/legacy_web", "/webrtc", "/br_sr", "/sr_res", "/t_ms", "/thread_typing", "/orca_typing_notifications", "/notify_disconnect", "/orca_presence"],
            (err: Error, granted: mqtt.ClientSubscribeCallback) => {
                client.unsubscribe('/orca_message_notifications', (err: Error) => {
                    let queue = {
                        "sync_api_version": 10,
                        "max_deltas_able_to_process": 1000,
                        "delta_batch_size": 500,
                        "encoding": "JSON",
                        "entity_fbid": uid,
                        "initial_titan_sequence_id": irisSeqID,
                        "device_params": null
                    }

                    client.publish('/messenger_sync_create_queue', JSON.stringify(queue), { qos: 0, retain: false })
                });
            });
    }
}

/**
 * Sau khi connect thành công, hàm này sẽ được gọi. :>
 */
function clientOnMessage(callbackFunc: Function) {
    return function (event: any, message: OnMessageCallback, packet: PacketCallback): void {

        const eventData: any = JSON.parse(message.toString());
        if (eventData.errorCode === "ERROR_QUEUE_OVERFLOW") return log("error", "ERROR_QUEUE_OVERFLOW");

        handleEventTopic(event, eventData, callbackFunc)
    }
}

/**
 * Lọc và xử lý các event
 */
function handleEventTopic(event: string, eventData: MessageEvent, callbackFunc: Function): void {

    /**
     * Event này sẽ bao gồm các tin nhắn mới (text, hình ảnh, âm thanh, ...)
     * @callback data {threadID, isGroup, senderId, text, messageId}
     */
    if (event === "/t_ms") {
        if (!eventData.deltas) return

        eventData.deltas.forEach((message: any) => {

            if (message.class === "NewMessage") {
                let messageId: string = message.messageMetadata.messageId

                if (message.body !== undefined && lastMessageId.includes(messageId) === false) {

                    /** check self listen */
                    if (parseInt(message.messageMetadata.actorFbId) === uid && !options.selfListen) return

                    /** log message */
                    if (options.logMessage) {
                        log("receive", message.messageMetadata.actorFbId + " > " + message.body)
                    }

                    let threadId = (message.messageMetadata.threadKey.threadFbId) ? message.messageMetadata.threadKey.threadFbId : message.messageMetadata.threadKey.otherUserFbId

                    callbackFunc({
                        threadId: parseInt(threadId),
                        isGroup: message.messageMetadata.threadKey.threadFbId !== undefined,
                        senderId: message.messageMetadata.actorFbId,
                        text: message.body,
                        messageId
                    }
                    , new Messenger(uData))

                    lastMessageId.push(messageId)
                    lastMessageId.shift()
                }

            }
        })
    }

    /**
     * Sự kiện typing (đang gõ) từ người dùng.
     */
    if (event === "/thread_typing") {

    }

    if (event === "/orca_presence") {

    }
}

/**
 * Hàm này tạo một id ngẫu nhiên với định dạng
 * xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
function getGUID(): string {
    var sectionLength = Date.now();
    var id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.floor((sectionLength + Math.random() * 16) % 16);
        sectionLength = Math.floor(sectionLength / 16);
        var _guid = (c == "x" ? r : (r & 7) | 8).toString(16);
        return _guid;
    });
    return id;
}
