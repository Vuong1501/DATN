import { connectMySQL } from "../config/db.js";
import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";


const registerUser = () => {
    return { id: Date.now(), username, password };
}

export { registerUser };