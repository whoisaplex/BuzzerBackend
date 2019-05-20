const mongoose = require('mongoose')

const Messages = new mongoose.Schema({
    id: String,
    userId: String,
    userFullname: String,
    userUsername: String,
    userImageURL: {type: String, default: null},
    content: String,
    created: String
})

module.exports = mongoose.model('Messages', Messages)