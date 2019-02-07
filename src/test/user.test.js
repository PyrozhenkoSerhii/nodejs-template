import request from 'supertest'
import chai from 'chai'
import async from 'async'
import mongoose from 'mongoose'

import router from '../server'
import testData from './data/user.json'
import User from '../models/User'

const environment = process.env.NODE_ENV || 'dev'

const assert = chai.assert
let insertedUser = undefined



describe('=== User Controller ===', () => {
    before(done => {
        if (environment === 'test') {
            User.deleteMany({}, err => {
                if (err) console.log(err)
                // IMPORTANT! Wait for loading of all api component, especially node-mailer
                setTimeout(() => done(), 1500)
            })
        }
    })

    after(done => {
        if (environment === 'test') {
            User.deleteMany({}, err => {
                if (err) console.log(err)
                mongoose.disconnect(err => {
                    if (err) console.log(err)
                    done()
                })
            })
        }
    })

    it("GET /users", done => {
        request(router).get('/users')
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.typeOf(res.body.data, 'array', 'Returned data must be an array')

                done()
            })
    })
    it("GET /users redis speeds up", done => {
        request(router).get('/users')
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.typeOf(res.body.data, 'array', 'Returned data must be an array')

                done()
            })
    })
    it("POST /users [valid]", done => {
        request(router).post('/users')
            .send(testData.valid).set('Accept', 'application/json')
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 201, 'Status must be 201')
                assert.notTypeOf(res.body.data, 'undefined', 'Response must contain the data')
                assert.typeOf(res.body.error, 'undefined', 'Response mustn\'t contain errors')

                insertedUser = res.body.data._id

                done()
            })
    })
    it("POST /users [duplicate email]", done => {
        request(router).post('/users')
            .send(testData.existing).set('Accept', 'application/json')
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 400, 'Status must be 400')
                assert.notTypeOf(res.body.error, 'undefined', 'Email unique error must be raised')

                done()
            })
    })
    it("POST /users [wrong data]", done => {
        async.series([
            cb => request(router).post('/users').send(testData.wrongUsername).expect(400, cb),
            cb => request(router).post('/users').send(testData.wrongEmail).expect(400, cb),
            cb => request(router).post('/users').send(testData.wrongPassword).expect(400, cb),
            cb => request(router).post('/users').send(testData.wrongAge).expect(400, cb),
            cb => request(router).post('/users').send(testData.wrongImage).expect(400, cb),
            cb => request(router).post('/users').send(testData.empty).expect(400, cb),
        ], done)
    })
    it("GET /users/:id", done => {
        request(router).get(`/users/${insertedUser}`)
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.notTypeOf(res.body.data, 'undefined', 'Response must contain the data')

                done()
            })
    })
    it("GET /users/:id redis speeds up", done => {
        request(router).get(`/users/${insertedUser}`)
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.notTypeOf(res.body.data, 'undefined', 'Response must contain the data')

                done()
            })
    })
    it("AUTHENTICATE /users/authenticate [not verified]", done => {
        request(router).post('/users/authenticate')
            .send(testData.auth)
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 403, 'Status must be 403')
                assert.notTypeOf(res.body.error, 'undefined', 'Response must contain an error')

                done()
            })
    })
    it("AUTHENTICATE /users/authenticate [missed pass]", done => {
        request(router).post('/users/authenticate')
            .send(testData.authMissed)
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 400, 'Status must be 400')
                assert.notTypeOf(res.body.error, 'undefined', 'Response must contain an error')

                done()
            })
    })
    it("VERIFY EMAIL /users/verifyEmail", done => {
        request(router).post('/users/verifyEmail')
            .send({ email: testData.auth.email }).set('Accept', 'application/json')
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.notTypeOf(res.body.message, 'undefined', 'Response must containt a message')

                request(router).get(`/users/verifying/${insertedUser}`)
                    .end((err, res) => {
                        if (err) throw done(err)

                        assert.equal(res.status, 200, 'Status must be 200')
                        assert.notTypeOf(res.body.message, 'undefined', 'Response must containt a message')

                        done()
                    })
            })
    })
    it("AUTHENTICATE /users/authenticate [verified]", done => {
        request(router).post('/users/authenticate')
            .send(testData.auth)
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.notTypeOf(res.body.token, 'undefined', 'Response must contain a token')

                done()
            })
    })
    it("CHANGE PASSWORD /users/resetPasswordRequest", done => {
        const hash = 'somehash'

        request(router).post('/users/resetPasswordRequest')
            .send({ email: testData.valid.email, hash }).set('Accept', 'application/json')
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.notTypeOf(res.body.message, 'undefined', 'Response must containt a message')

                request(router).post(`/users/resetPasswordConfirm/${hash}`)
                    .send({ password: testData.update.password }).set('Accept', 'application/json')
                    .end((err, res) => {
                        if (err) throw done(err)

                        assert.equal(res.status, 200, 'Status must be 200')
                        assert.notTypeOf(res.body.message, 'undefined', 'Response must containt a message')

                        done()
                    })

            })
    })
    it("PUT /users/:id", done => {
        request(router).put(`/users/${insertedUser}`)
            .send(testData.update)
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.notTypeOf(res.body.message, 'undefined', 'Response must containt a message')

                done()
            })

    })
    // it("BEFORE DELETE /users/:id", done => {
    //     request(router).get('/users').end((err,res) => {console.log(res.body); done();})
    // })
    it("DELETE /users", done => {
        
        request(router).delete(`/users/${insertedUser}`)
            .end((err, res) => {
                if (err) throw done(err)

                assert.equal(res.status, 200, 'Status must be 200')
                assert.notTypeOf(res.body.message, 'undefined', 'Response must containt a message')

                done()
            })
    })
    // it("AFTER DELETE /users/:id", done => {
    //     request(router).get('/users').end((err,res) => {console.log(res.body); done();})
    // })
    /**
     * Fix it!
     */
    // it("GET DELETED /users/:id", done => {
    //     request(router).get(`/users/${insertedUser}`)
    //         .end((err, res) => {
    //             if (err) throw done(err)

    //             assert.equal(res.status, 400, 'Status must be 400')
    //             assert.notTypeOf(res.body.error, 'undefined', 'Response must contain an error')

    //             done()
    //         })
    // })
})

