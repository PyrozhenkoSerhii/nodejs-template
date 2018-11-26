/**
 * You need to create config.js file as well as .env file with your credentials.
 */

import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

const env = process.env.NODE_ENV || 'dev'

const dev = {
    api: {
        port: parseInt(process.env.DEV_API_PORT) || 8080,
        secret: process.env.DEV_JWT_SECRET || 'secret',
        logFile: process.env.DEV_LOG_FILE || 'exceptions.log',
    },
    db: {
        host: process.env.DEV_DB_HOST || 'localhost',
        port: parseInt(process.env.DEV_DB_PORT) || 27017,
        connectionString: process.env.DEV_DB_CONNECTION_STRING || 'Enter your DB connString',
        databaseName: process.env.DEV_DB_NAME || 'devDB',
        options: {
            useNewUrlParser: true
        }
    },
    redis: {
        host: process.env.REDIS_URL || '127.0.0.1',
        port: process.env.REDIS_PORT || '6379'
    },
    urls: {
        emailVerifyingBase: process.env.EMAIL_VERIFYING_BASE || 'http://localhost:8080/users/verifying/',
        passwordResetBase: process.env.PASSWORD_RESET_BASE || 'http://localhost:8080/users/resetPasswordConfirm/'
    },
    defaults: {
        image: "https://banner2.kisspng.com/20180401/dbq/kisspng-user-profile-computer-icons-profile-5ac09245049c32.0935523415225697970189.jpg"
    }
}

const prod = {
    api: {
        port: parseInt(process.env.PORT),
        secret: process.env.SECRET,
        logFile: process.env.DEV_LOG_FILE
    },
    db: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        connectionString: process.env.DB_CONNECTION_STRING,
        databaseName: process.env.DB_NAME,
        options: {
            useNewUrlParser: true
        }
    },
    urls: {
        emailVerifyingBase: process.env.EMAIL_VERIFYING_BASE,
        passwordResetBase: process.env.PASSWORD_RESET_BASE
    },
    redis: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_PORT
    },
    defaults: {
        image: "https://banner2.kisspng.com/20180401/dbq/kisspng-user-profile-computer-icons-profile-5ac09245049c32.0935523415225697970189.jpg"
    }
}

const test = {
    api: {
        port: 3000,
        secret: 'secret',
        logFile: 'exceptions_test.log'

    },
    db: {
        host: 'localhost',
        port: 27017,
        connectionString: 'Enter your DB connString',
        databaseName: 'testDB',
        options: {
            useNewUrlParser: true
        }
    },
    redis: {
        host: '127.0.0.1',
        port: '6379'
    },
    urls: {
        emailVerifyingBase: 'http://localhost:3000/users/verifying/',
        passwordResetBase: 'http://localhost:8080/users/resetPasswordConfirm/'
    },
    defaults: {
        image: "https://banner2.kisspng.com/20180401/dbq/kisspng-user-profile-computer-icons-profile-5ac09245049c32.0935523415225697970189.jpg"
    }
}


const config = {
    dev,
    prod,
    test
}

module.exports = config[env]