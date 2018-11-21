import jwt from 'jsonwebtoken'
import config from '../config'
import logger from './logger'
// import blacklist from 'express-jwt-blacklist'


exports.sign = user => {
    logger.info(`[JWT] User -${user.username}- was signed`)

    return jwt.sign(
        user.toJSON(),
        config.api.secret,
        {
            expiresIn: '24h'
        })
}


exports.verify = token => {
    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            logger.warn(`[JWT] Token isn't valid, err: ${JSON.stringify(err.name)}`)
            return false
        }

        if (decoded) {
            logger.info(`[JWT] Token was verified`)
            return true
        }
    })
}
