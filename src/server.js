import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import jwt from 'express-jwt'
import blacklist from 'express-jwt-blacklist'
import mongoose from 'mongoose'
import requestLimiter from 'express-rate-limit'
import helmet from 'helmet'

import config from './config'
import userRouter from './routes/user'
import loggerMiddleware from './middlewares/logger'
import logger from './utils/logger'


const api = express()
const limiter = requestLimiter({
    windowsMs: 15 * 60 * 1000,
    max: 100
})
blacklist.configure({
    store: {
        type: 'redis',
        host: config.redis.host,
        port: config.redis.port,
    }
})


const enviroment = process.env.NODE_ENV || 'dev'
if (enviroment === 'dev') api.enable('trust proxy')

api.use(helmet())
api.use(express.static(path.join(__dirname, 'public')))
api.use(cors())
api.use(bodyParser.urlencoded({ extended: true }))
api.use(bodyParser.json())
api.use(limiter)

enviroment !== 'test' && api.use(jwt({
    secret: config.api.secret,
}).unless(req =>
    req.originalUrl === '/' ||
    req.originalUrl === '/users' && req.method === 'POST' ||
    req.originalUrl === '/users/authenticate' ||
    req.originalUrl === '/users/resetPasswordRequest' ||
    req.originalUrl === '/users/verifyEmail' ||
    req.originalUrl.match(/^\/users\/verifying\/.*/) ||
    req.originalUrl.match(/^\/users\/resetPasswordConfirm\/.*/)
))
api.use(loggerMiddleware)
api.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        logger.warn(`[JWT] No authorization provided with request ${req.originalUrl}`)
        res.status(401).send({ error: `You have no permitions to make this request` })
    }
})


api.use('/users', userRouter)
api.get('*', (req, res) => {
    res.status(404).send({ error: `${req.originalUrl} not found!` })
})


mongoose.connect(config.db.connectionString, config.db.options).then(
    () => logger.info(`[API] Connection to ${config.db.databaseName} db was established `),
    err => logger.error(`[API] Error occured while connection to ${config.db.databaseName} db`, err)
)
mongoose.set('useCreateIndex', true)
enviroment === 'dev' && mongoose.set('debug', (coll, method) => {
    logger.info(`[Mongoose] Path: /${coll}, method: ${method}`)
});


api.listen(config.api.port, err => {
    if (err) {
        logger.error(`[API] Error while launhing the server: ${err}`)
        process.exit(1)
    } else {
        logger.info(`[API] Server is running on port ${config.api.port}`)
    }
})


exports.default = api