import express from 'express'
import ExpressBrute from 'express-brute'

import Controller from '../controllers/user'    
// import redis from '../utils/redis'

var store = new ExpressBrute.MemoryStore()
const options = {
    minWait: 3000
}
const bruteforce = new ExpressBrute(store, options)

let router = express.Router()

router.get('/', Controller.list)
router.get('/:id', Controller.get)
router.post('/', bruteforce.prevent, Controller.post)
router.put('/:id', Controller.put)
router.delete('/:id', Controller.delete)

router.post('/authenticate', bruteforce.prevent, Controller.authenticate)
router.post('/logout', Controller.logout)

router.post('/resetPasswordRequest', bruteforce.prevent, Controller.resetPasswordRequest)
router.post('/resetPasswordConfirm/:hash', bruteforce.prevent, Controller.resetPasswordConfirm)

router.post('/verifyEmail', bruteforce.prevent, Controller.verifyEmail)
router.get('/verifying/:id', bruteforce.prevent, Controller.verifying)

module.exports = router