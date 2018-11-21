import mongoose, { Schema } from 'mongoose'
import bcrypt from 'mongoose-bcrypt'
import timestamps from 'mongoose-timestamp'

import config from '../config'
import regex from '../utils/regex'
import Order from './submodels/Order'


const UserSchema = new Schema({
    email: {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
        unique: true,
        required: [true, 'Email is required'],
        match: [regex.email, 'Please, enter a valid email']
    },
    verified: {
        type: Boolean,
        default: false
    },
    username: {
        type: String,
        lowercase: true,
        trim: true,
        required: [true, 'Username is required']
    },
    password: {
        type: String,
        select: false,
        bcrypt: true,
        required: [true, 'Password is required'],
        match: [regex.password, 'Wrong password format, minimum 8 characters, at least 1 number required']
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [5, 'Enter a valid age'],
        max: [115, 'Enter a valid age']
    },
    image: {
        type: String,
        default: config.defaults.image,
        match: [regex.url, 'Please, provide a valid secure url']
    },
    orders: [Order]
})


UserSchema.plugin(bcrypt)
UserSchema.plugin(timestamps)


module.exports = mongoose.model('User', UserSchema);