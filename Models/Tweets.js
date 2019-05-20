const mongoose = require('mongoose')

const Tweets = new mongoose.Schema({
    id: String,
    creatorID: String,
    creatorName: String,
    creatorUsername: String,
    creatorImageURL: {type: String, default: null},
    created: String,
    content: String,
    likes: Array,
    comments: Number,
    retweets: Number,
    isRebuzz: {type: Boolean, default: false},
    OGBuzzId: {type: String, default: null},
    OGCreatorName: {type: String, default: null},
    OGCreatorUsername: {type: String, default: null},
    OGCreatorImageURL: {type: String, default: null},
    OGContent: {type: String, default: null}
}) 

module.exports = mongoose.model('Tweets', Tweets)