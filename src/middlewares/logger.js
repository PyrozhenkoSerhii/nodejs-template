import shortid from 'shortid'

import logger from '../utils/logger'
import { idCharacters } from "../utils/regex";

shortid.characters(idCharacters)


const loggerMiddleware = (req, res, next) => {
    const id = shortid.generate()
    const withBody = process.env.NODE_ENV === 'dev'

    addJsonBody(res)

    if (withBody) {
        logger.info(`[${id}] Request url:${req.originalUrl}, method:${req.method}, headers:${req.headers['user-agent']}, body:${JSON.stringify(req.body)}`)
    } else {
        logger.info(`[${id}] Request url:${req.originalUrl}, method:${req.method}, headers:${req.headers['user-agent']}`)
    }

    const onFinishedListener = () => {
        clearListeners()
        if (res.statusCode >= 500) {
            logger.error(`[${id}] Request on url ${req.originalUrl} finished with status ` +
                `${res.statusCode} ${res.statusMessage}, err: ${JSON.stringify(res.JsonBody.error)}`)
        }
        else if (res.statusCode >= 400) {
            logger.warn(`[${id}] Request on url ${req.originalUrl} finished with status ` +
                `${res.statusCode} ${res.statusMessage}, err: ${JSON.stringify(res.JsonBody.error || res.JsonBody.errors)}`)
        }
        else {
            logger.info(`[${id}] Request on url ${req.originalUrl} finished with status ${res.statusCode} ${res.statusMessage}`)
        }
        res.JsonBody = null
    }

    const onClosedListener = () => {
        clearListeners()
        logger.warn(`[${id}] Request on url ${req.originalUrl} was aborted by the client`)
    }

    const onErrorListener = err => {
        clearListeners()
        logger.error(`[${id}] Unexpected error occured during requst on url ${req.originalUrl}, error: ${JSON.stringify(err)}`)
    }

    const clearListeners = () => {
        res.removeListener('finish', onFinishedListener)
        res.removeListener('close', onClosedListener)
        res.removeListener('error', onErrorListener)
    }

    res.on('finish', onFinishedListener)
    res.on('close', onClosedListener)
    res.on('error', onErrorListener)

    next()
}

const addJsonBody = res => {
    const oldEnd = res.end

    let bodyBuffer = []

    res.end = (...rest) => {
        try {
            if (rest[0]) bodyBuffer.push(new Buffer(rest[0]))
            res.JsonBody = JSON.parse(Buffer.concat(bodyBuffer).toString('utf8'))
            oldEnd.apply(res, rest)
        } catch (e) {
            res.JsonBody = "{error: 'Unexpected error occured due code'}"
            oldEnd.apply(res, rest)
        }
    }
}

export default loggerMiddleware