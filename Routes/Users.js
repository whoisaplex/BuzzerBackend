// Route: /users
const express = require('express')
const Router = express.Router()
const mongoose = require('mongoose')
const TOKEN_AUTH = require('../Globals/TOKEN_AUTH')

const Users = require('../Models/Users')

Router.get('/', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
  const {username, my_id} = req.query
  Users.aggregate()
  .match({ username: username})
  .project({
    id: 1,
    username: 1,
    firstName: 1,
    lastName: 1,
    buzzers: 1,
    rebuzzers: 1,
    followers: 1
  }).exec((error, documents) => {
    if(error) return console.log(err)
    if(documents.length !== 1) return res.status(404).send({error: 'User doesn\'t exists'})
    documents[0].followersSize = documents[0].followers.length
    documents[0].isfollowing = documents[0].followers.includes(my_id)
    res.send(documents[0]).status(200)
  })
})

Router.post('/follow', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
  const {User_id, My_id} = req.body
  Users.updateOne({ id: User_id }, { $push: { followers: My_id }}, (error, success) => {
    Users.updateOne({ id: My_id }, { $push: { following: User_id }}, (error, sucess) => {
      res.sendStatus(200)
    })
  })
})

Router.post('/unfollow', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
  const {User_id, My_id} = req.body
  Users.updateOne({ id: User_id }, { $pull: { followers: My_id }}, (error, success) => {
    Users.updateOne({ id: My_id }, { $pull: { following: User_id }}, (error, sucess) => {
      res.sendStatus(200)
    })
  })
})

Router.get('/searchUser', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
  const searchInput = req.query.searchInput
  const reg = new RegExp(searchInput, 'i')
  
  Users.find({
    '$or': [ {'firstName': reg}, {'lastName': reg}, {'username': reg} ]
  }).exec((error, documents) => {
    res.send(documents)
  })
})

module.exports = Router