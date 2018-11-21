import redis from 'redis'

import config from '../config'
import logger from './logger'

const client = redis.createClient({
    port: config.redis.port,
    host: config.redis.host,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
})

client.on('connect', () => {
    logger.info(`[Redis] Connection created on port ${config.redis.port} and host ${config.redis.host}`)
})

client.on('error', (err) => {
    logger.error(`Redis error: ${err} `)
})

export default client
