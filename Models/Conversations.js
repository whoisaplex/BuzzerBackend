const mongoose = require('mongoose')

const Conversations = new mongoose.Schema({
    userId: String,
    conversations: Array
}) 

module.exports = mongoose.model('Conversations', Conversations)