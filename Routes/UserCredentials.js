const express = require('express')
const Router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const JWT = require('jsonwebtoken')

const UserCredentials = require('../Models/UserCredentials')
const Users = require('../Models/Users')

const SALT_ROUNDS = 10

//LOGIN
Router.post('/login', (req, res) => {
    const LoginInfo = req.body
    UserCredentials
    .findOne({username: LoginInfo.username}, (err, user) => {
        if(err) return console.log(err)
        if(user){
            if(CompareHashedPassword(LoginInfo.password, user.password)){
                const TOKEN_DATA = {
                    Id: user.id,
                    Username: user.username,
                    Fullname: `${user.firstName} ${user.lastName}`
                }
                const TOKEN = JWT.sign({TOKEN_DATA}, 'secret', {expiresIn: 60 * 60 * 6})
                res.send(TOKEN).status(200) 
            }else{ res.sendStatus(404) }
        }else{
            //User not found
            res.sendStatus(404)
        }
    })
})

//REGISTER
Router.post('/register', (req, res) => {
    const RegisterInfo = req.body
    UserCredentials.findOne({username: RegisterInfo.username}, (err, user) => {
        if(!user){
            const ID = mongoose.Types.ObjectId()
            const UserCredential = new UserCredentials(UserCredentialConstructor(RegisterInfo, ID))
            const User = new Users(UserConstructor(RegisterInfo, ID))

            UserCredential.save((err, userCred) => {
                if(err) return console.log(err)
                User.save((err, user) => {
                    if(err) return console.log(err)
                    res.sendStatus(201)
                })
            })
        }else{ res.sendStatus(403) }
    })
})

module.exports = Router

function UserCredentialConstructor(User, ID){
    return {
        id: ID,
        firstName: User.firstName,
        lastName: User.lastName,
        username: User.username,
        password: CreateHashedPassword(User.password) 
    }
}

function UserConstructor(User, ID){
    return {
        id: ID,
        firstName: User.firstName,
        lastName: User.lastName,
        username: User.username,
        buzzers: 0,
        rebuzzers: 0,
        followers: [],
        following: []
    }
}

function CreateHashedPassword(U_PASSWORD){
    const SALT = bcrypt.genSaltSync(SALT_ROUNDS)
    return bcrypt.hashSync(U_PASSWORD, SALT)
}

function CompareHashedPassword(U_PASSWORD, DB_PASSWORD){
    return bcrypt.compareSync(U_PASSWORD, DB_PASSWORD)
}