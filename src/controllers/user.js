import _ from 'lodash'

import User from '../models/User'
import redis from '../utils/redis'
import logger from '../utils/logger'
import config from '../config'
import { createTestTransport, createGmailTransport, verificationMessage, passwordResetMessage } from "../utils/mailer"
import { sign } from '../utils/jwt'


const ObjectId = require('mongoose').Types.ObjectId
const UNIQUE_CHECK_FAILED_CODE = 11000
const enviroment = process.env.NODE_ENV || 'dev'


let transport = null;
if (enviroment !== 'dev') {
    createTestTransport(callback => transport = callback)
} else {
    createGmailTransport(callback => transport = callback)
}


exports.list = (req, res) => {
    User.find((err, users) => {
        if (err) return res.status(500).send({ error: "Something went wrong while fetching all users." })

        return res.status(200).send({ data: users })
    });
}


exports.get = (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: `Invalid id: ${req.params.id}` })

    redis.get(req.params.id, (err, user) => {
        if (err) logger.error(`[Redis] Error while attempting to fetch user with id ${req.params.id}, req: ${req.originalUrl}`, err)
        if (user) return res.status(200).send({ data: JSON.parse(user) })

        User.findById(req.params.id, (err, user) => {
            if (err) return res.status(500).send({ error: `Something went wrong while fetching user with id ${req.params.id}.` })

            redis.set(req.params.id, JSON.stringify(user), err => {
                if (err) logger.error(`[Redis] Error while attempting to save user with id ${req.params.id}, req: ${req.originalUrl}`, err)
                else logger.info(`[Redis] User with id ${req.params.id} was saved`)
            })

            return res.status(200).send({ data: user })
        })
    })
}


exports.post = (req, res) => {
    const user = new User({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        age: req.body.age,
        image: req.body.image || config.defaults.image,
        orders: req.body.orders || []
    })

    user.save((err, savedUser) => {
        if (err) {
            let validationErrors = _.map(err.errors, error => { return { field: error.path, error: error.message } })

            if (validationErrors.length !== 0) return res.status(400).send({ errors: validationErrors })

            return err.code === UNIQUE_CHECK_FAILED_CODE
                ? res.status(400).send({ error: `User with email ${req.body.email} is already exist.` })
                : res.status(500).send({ error: "Something went wrong while creating user." });
        }

        const message = verificationMessage(savedUser)
        transport.sendMail(message, (err, info) => {
            if (err) return logger.error(`[Node mailer] Error occured while sending message to ${savedUser.email}`, err.message || err)

            logger.info(`[Node mailer] Message was successfully delivered to ${savedUser.email} from ${info.envelope.from}`)

            transport.close()
        })


        return res.status(201).send({ data: savedUser });
    });
}


exports.put = (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: `Invalid id: ${req.params.id}.` })

    User.findById(req.params.id, (err, user) => {
        if (err) return res.status(500).send({ error: `Something went wrong while fetching user with id ${req.params.id}.` })
        if (!user) return res.status(400).send({ error: `User with id ${req.params.id} wasn't found.` })

        user.email = req.body.email || user.email;
        user.username = req.body.username || user.username;
        user.age = req.body.age || user.age;
        user.image = req.body.image || user.image;
        user.orders = req.body.orders || user.orders;

        user.save((err, updatedUser) => {
            if (err) {
                let validationErrors = _.map(err.errors, error => { return { field: error.path, error: error.message } })
                if (validationErrors.length !== 0) return res.status(400).send({ errors: validationErrors })

                return res.status(500).send({ error: `Something went wrong while updating user with id ${req.params.id}.` })
            }

            redis.get(updatedUser._id.toString(), (err, user) => {
                if (err) logger.error(`[Redis] Error while attemping to fetch user with id ${req.params.id}, req: ${req.originalUrl}`, err)

                if (user) redis.set(updatedUser._id.toString(), JSON.stringify(updatedUser), err => {
                    if (err) logger.error(`[Redis] Error while attemping to update user with id ${req.params.id}, req: ${req.originalUrl}`, err)
                    else logger.info(`[Redis] User with id ${req.params.id} was updated`)
                })
            })

            return res.status(204)
        });
    })
}


exports.delete = (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: `Invalid id: ${req.params.id}` })

    User.findById(req.params.id, (err, user) => {
        if (err) return res.status(500).send({ error: `Something went wrong while fetching user with id ${req.params.id}.` })
        if (!user) return res.status(400).send({ error: `User with id ${req.params.id} wasn't found.` })

        user.remove(err => {
            if (err) return res.status(500).send({ error: `Something went wrong while deleting user with id ${req.params.id}.` })

            return res.status(204);
        });
    })
}


exports.authenticate = (req, res) => {
    if (!req.body.username || !req.body.password) return res.status(400).json({ error: 'Username and password are required!' })

    User.findOne({ username: req.body.username }).select('+password').exec((err, user) => {
        if (err) return res.status(500).send({ error: `Something went wrong while fetching user with id ${req.params.id}.` })
        if (!user) return res.status(400).send({ error: 'Wrong username or password' })
        if (!user.verified) return res.status(403).send({ error: 'You need to verify your email first' })

        user.verifyPassword(req.body.password, (err, valid) => {
            if (err) return res.status(500).send({ error: 'Something went wrong while verifying the password' })

            if (valid) {
                const token = sign(user)

                return res.status(200).send({ token })
            }

            return res.status(400).send({ error: 'Username or password is incorrect' })
        })
    })
}


exports.logout = (req, res) => {
    return res.status(501).send({ error: `The logout will be implemented soon!` })
}


exports.resetPasswordRequest = (req, res) => {
    if (!req.body.email || !req.body.hash) return res.status(400).send({ error: 'Some data are needed for password reseting is absent!' })

    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) return res.status(500).send({ error: `Something went wrong while fetching user with email ${req.body.email}` })
        if (!user) return res.status(400).send({ error: `There are no users with email ${req.body.email}` })

        redis.set(req.body.hash, req.body.email, err => {
            if (err) {
                logger.error(`[Redis] Error while setting data for password reset (${req.body.hash}:${req.body.email})`, err)
                return res.status(500).send({ error: `Something went wrong while storing data for password reset` })
            }
            logger.info(`[Redis] Item for password reset was created (${req.body.hash}:${req.body.email})`)
        })

        const message = passwordResetMessage(user, req.body.hash)
        transport.sendMail(message, (err, info) => {
            if (err) return res.status(500).send({ error: `Something went wrong while sending message to ${user.email}` })

            logger.info(`[Node mailer] Message was successfully delivered to ${user.email} from ${info.envelope.from}`)

            transport.close()

            return res.status(200).send({ message: `Message was sent to ${user.email}` })
        })
    })
}


exports.resetPasswordConfirm = (req, res) => {
    if (!req.params.hash) return res.status(403).send({ error: 'You have no permissions to make a password reset!' })
    if (!req.body.password) return res.status(400).send({ error: 'There is no password provided' })

    redis.get(req.params.hash, (err, emailFromHash) => {
        if (err) {
            logger.error(`[Redis] Error occured while attempting to fetch hash for password restore: ${req.params.hash}`, err)
            return res.status(500).send({ error: 'Something went wrong while handling password reset' })
        }

        if (!emailFromHash) return res.status(403).send({ error: 'You have no permissions to make a password reset! (Wrong hash)' })

        redis.del(req.params.hash, err => {
            if (err) logger.error(`[Redis] Error occured while attempting to delete hash ${req.params.hash} `)
            else logger.info(`[Redis] Used hash for password reset (${req.params.hash}) was deleted`)
        })

        User.findOne({ email: emailFromHash }, (err, user) => {
            if (err) return res.status(500).send({ error: `Something went wrong while fetching user with email: ${emailFromHash}` })
            if (!user) return res.status(400).send({ error: 'User wasn\'t found' })

            user.password = req.body.password

            user.save((err, updatedUser) => {
                if (err) {
                    let validationErrors = _.map(err.errors, error => { return { field: error.path, error: error.message } })
                    if (validationErrors.length !== 0) return res.status(400).send({ errors: validationErrors })

                    return res.status(500).send({ error: `Something went wrong while changing users' password with id ${req.params.id}.` })
                }

                redis.get(updatedUser._id.toString(), (err, user) => {
                    if (err) logger.error(`[Redis] Error while attemping to fetch user with id ${req.params.id}, req: ${req.originalUrl}`, err)

                    if (user) redis.set(updatedUser._id.toString(), JSON.stringify(updatedUser), err => {
                        if (err) logger.error(`[Redis] Error while attemping to update user with id ${req.params.id}, req: ${req.originalUrl}`, err)
                        else logger.info(`[Redis] User with id ${req.params.id} was updated`)
                    })
                })

                return res.status(204)
            })
        })
    })
}


exports.verifyEmail = (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) return res.status(500).send({ error: 'Something went wrong while sending verifying message!' })
        if (!user) return res.status(400).send({ error: `There are no users with such credentials!` })

        const message = verificationMessage(user)
        transport.sendMail(message, (err, info) => {
            if (err) {
                logger.error(`[Node mailer] Error occured while sending message to ${user.email}`, err.message || err)
                return res.status(400).send({ error: 'Something went wrong while message sending' })
            }

            logger.info(`[Node mailer] Message was successfully delivered to ${user.email} from ${info.envelope.from}`)

            transport.close()

            return res.status(200).send({ message: `Message was sent to ${user.email}` })
        })
    })
}


exports.verifying = (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if (err) return res.status(500).send({ error: 'Something went wrong while verifying email!' })
        if (!user) return res.status(400).send({ error: `There are no users with such credentials!` })

        user.verified = true

        user.save(err => {
            if (err) return res.status(500).send({ error: `Something went wrong while verifying email of user ${req.params.id}.` });

            return res.status(200).send('Email was verified!');
        })
    })
}