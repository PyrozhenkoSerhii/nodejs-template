import { Schema } from 'mongoose'

exports.default = new Schema({
    product: {
        type: String,
        required: [true, 'Product info is required'],
        trim: true
    },
    quantity: {
        type: Number,
        min: [1, 'Enter a valid product quantity']
    },
    price: {
        type: Number,
        min: [1, "The price field is invalid"]
    },
    date: {
        type: Date,
        default: Date.now()
    }
})