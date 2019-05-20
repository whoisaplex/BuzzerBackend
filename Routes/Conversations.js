const express = require('express')
const Router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const TOKEN_AUTH = require('../Globals/TOKEN_AUTH')

const Conversations = require('../Models/Conversations')
const Messages = require('../Models/Messages')

Router.get('/', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const conversationId = req.query.conversationId
    Messages.find({ id: conversationId }).sort({'created': -1}).lean().exec((error, Messages) => {
        if(error) return res.send(error)
        res.send(HumanizeTimestamp(Messages))
    })
})

Router.post('/', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const {conversationId, userId, userFullname, userUsername, content} = req.body
    Conversations.findOne({ userId: userId }).exec((error, response) => {
        if( !hasConversation(response.conversations, conversationId) ) return res.sendStatus(500)
        const Message = new Messages(MessageConstructor(req.body))
        Message.save(saveError => {
            if(saveError) return res.sendStatus(500)
            res.send(Message) 
        }) 
    })
})

Router.get('/conversations', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const userId = req.query.userId
    Conversations.findOne({ userId: userId }).exec((error, conversationObject) => {
        if(error) return res.send(userId)
        res.send(conversationObject.conversations)
    })
})

function MessageConstructor(Message){
    return {
        id: Message.conversationId,
        userId: Message.userId,
        userFullname: Message.userFullname,
        userUsername: Message.userUsername,
        content: Message.content,
        created: new moment().format('YYYY-MM-DDTHH:mm:ssZ')
    }
}

function hasConversation(Conversations, id){
    hasConv = false
    Conversations.forEach(Conversation => {
        if(Conversation.conversationId === id) hasConv = true
    })
    return hasConv
}

function HumanizeTimestamp(Messages){
    return Messages.map(Message => {
        Message.createdHumanize = moment(Message.created).format('YYYY-MM-DD - HH:mm')
        return Message
    })
}

module.exports = Router