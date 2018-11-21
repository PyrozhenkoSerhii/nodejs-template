import { createLogger, format, transports } from 'winston'
const { combine } = format


import config from '../config'


const enviroment = process.env.NODE_ENV || 'dev'
const isDev = enviroment === 'dev'


let logger = createLogger({
    format: combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        isDev && new transports.Console({
            format: combine(
                format.colorize(),
                format.timestamp({ format: 'HH:mm:ss' }),
                format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        }),
        new transports.File({ filename: config.api.logFile, level: 'warn' }),
        new transports.File({ filename: config.api.logFile, level: 'error' })
    ]
});


export default logger