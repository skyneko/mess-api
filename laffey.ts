import { login, User } from "./src/index"
import { readFileSync } from "fs";

const user: User = JSON.parse(readFileSync("./user/config.json", "utf-8"))

login(user)