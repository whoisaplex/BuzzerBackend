const mongoose = require('mongoose')

const Comments = new mongoose.Schema({
    id: String,
    BuzzId: String,
    creatorID: String,
    creatorName: String,
    creatorUsername: String,
    creatorImageURL: {type: String, default: null},
    created: String,
    content: String,
}) 

module.exports = mongoose.model('Comments', Comments)