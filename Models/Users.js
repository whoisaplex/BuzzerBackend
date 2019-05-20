const mongoose = require('mongoose')

const Users = new mongoose.Schema({
    id: String,
    firstName: String,
    lastName: String,
    username: {type: String},
    buzzers: Number,
    rebuzzers: Number, 
    followers: Array,
    following: Array
}) 

module.exports = mongoose.model('Users', Users)