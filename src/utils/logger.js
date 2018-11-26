import { createLogger, format, transports } from 'winston'
const { combine } = format

import config from '../config'

const enviroment = process.env.NODE_ENV || 'dev'


let logger = createLogger({
    format: combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new transports.Console({
            silent: enviroment === 'test',
            format: combine(
                format.colorize(),
                format.timestamp({ format: 'HH:mm:ss' }),
                format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        }),
        new transports.File({
            filename: config.api.logFile,
            level: 'warn',
            silent: enviroment === 'test'
        }),
        new transports.File({
            filename: config.api.logFile,
            level: 'error',
            silent: enviroment === 'test'
        })
    ]
});


export default logger