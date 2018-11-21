import nodemailer from 'nodemailer'

import logger from './logger'
import config from '../config'


exports.createTestTransport = result => nodemailer.createTestAccount((err, account) => {
    if (err) logger.error(`[Node mailer] Error occured while creating account`)

    logger.info('[Node mailer] Mailer account was created successfully!')

    const transport = nodemailer.createTransport(
        {
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass
            },
        },
        {
            from: 'Serhii <Pirogenkoss85@gmail.com>',
            headers: {
                'X-Laziness-level': 1000
            }
        }
    )

    logger.info(`[Node mailer] Transport (for test only) was created successfully with following user ${account.user}!`)

    result(transport)
})

exports.createGmailTransport = (result) => {
    const transport = nodemailer.createTransport(
        {
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            socketTimeout: 5000,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        },
        {
            from: 'Serhii Pyrozhenko <Pirogenkoss85@gmail.com>',
            headers: {
                'X-Laziness-level': 1000
            }
        }
    )

    logger.info(`[Node mailer] Gmail transport was created successfully with following user: ${process.env.MAIL_USER}!`)

    result(transport)
}


exports.verificationMessage = user => ({
    to: user.email,
    subject: 'Email verification',
    text: `Hello, ${user.username}! If it isn't you, just ignore the message. Otherwise, please, ` +
        `verify your email by following link ${config.urls.emailVerifyingBase}${user._id}!`
})

exports.passwordResetMessage = (user, hash) => ({
    to: user.email,
    subject: 'Password reset',
    text: `Hello, ${user.username}! You've just sent a request to restore your password,` +
        `if it isn't you, just ignore the message. Otherwise, please, use following link ${config.urls.passwordResetBase}${hash}!`
})
