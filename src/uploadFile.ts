import request from "request"
import fs from "fs"
import { createHeader, UserRequestData} from "./utils"


/**
 * Tải một file lên facebook và trả về id
 * @param data 
 * @param filePath Đường dẫn file
 * @return File id.
 */
export function uploadFile(data: UserRequestData, filePath: string): Promise<number> {

    const filename: string = filePath.slice(filePath.lastIndexOf("/") + 1, filePath.length);
    let headers: any = createHeader(data.cookie)
        headers["Content-Type"] = 'multipart/form-data; boundary=---------------------------11227507362007673615787878216';
        headers["X-MSGR-Region"] = 'ATN';
    
    return new Promise((resolve) => {

        
    })
}