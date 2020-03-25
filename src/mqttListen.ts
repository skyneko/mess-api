import { UserRequestData, getUIDFromCookie, log } from "./utils"
import mqtt, { PacketCallback, OnMessageCallback } from "mqtt"
import { refreshPage } from "./login"
import websocket from "websocket-stream"

export interface Message {
    attachments: Array<any>,
    body: string,
    irisSeqId: string
    irisTags: Array<string>,
    messageMetadata: {
        actorFbId: string,
        folderId: {
            systemFolderId: string
        },
        messageId: string,
        offlineThreadingId: string,
        skipBumpThread: boolean,
        tags: Array<string>,
        threadKey: { threadFbId: string },
        threadReadStateEffect: string,
        timestamp: string
    },
    participants: Array<string>,
    requestContext: object,
    tqSeqId: string,
    class: string
}

interface MessageEvent {
    deltas: Array<object>,
    firstDeltaSeqId: number,
    lastIssuedSeqId: number,
    queueEntityId: number
}

let lastIrisSeqId: string
let lastMessageId: Array<string> = ["1", "2", "3", "4", "5"]
const loopTime: number = 10 * 1000

export function listen(data: UserRequestData, callback: Function, userAgent?: string): void {

    if (!userAgent)
        userAgent = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0"

    const { irisSeqID, cookie } = data
    const uid: number = getUIDFromCookie(cookie)
    const sessionID: number = Math.floor(Math.random() * 9007199254740991) + 1
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

    let requestCount = 0

    function connectMqttServer() {
        refreshPage(cookie)
            .then((data: UserRequestData) => {
                //log("info", "refresh page ... "+ data.irisSeqID)
                const client = new mqtt.Client(() => websocket(websocket_client_url, undefined, websocketOptions), mqttOptions)
                const irisSeqID = (requestCount > 1) ? data.irisSeqID + ++requestCount : data.irisSeqID

                client.on("error", clientOnError)
                client.on("connect", clientOnConnect(client, uid, irisSeqID))
                client.on("message", clientOnMessage(callback))
            })
    }

    // wait
    setTimeout(() => {
        log("info", "Listen ... ")
    }, loopTime);
    // loop
    setInterval(connectMqttServer, loopTime)

}

function clientOnError(err: Error): void {
    log("error", "WebSocket connection failed.")
}

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

function clientOnMessage(callbackFunc: Function) {
    return function (event: any, message: OnMessageCallback, packet: PacketCallback): void {

        const data: any = JSON.parse(message.toString());
        if (data.errorCode === "ERROR_QUEUE_OVERFLOW") return log("error", "ERROR_QUEUE_OVERFLOW");

        handleEventTopic(event, data, callbackFunc)
    }
}

function handleEventTopic(event: string, data: MessageEvent, callbackFunc: Function): void {
    if (event === "/t_ms") {
        if (!data.deltas) return

        data.deltas.forEach((msg: any) => {
            if (msg.class === "NewMessage") {
                let message: Message = msg
                let messageId: string = message.messageMetadata.messageId

                if (message.body !== undefined && lastMessageId.includes(messageId) === false) {
                    callbackFunc(message)

                    lastMessageId.push(messageId)
                    lastMessageId.shift()
                }

            }
        })
    }

    if (event === "/thread_typing") {

    }

    if (event === "/orca_presence") {

    }
}

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