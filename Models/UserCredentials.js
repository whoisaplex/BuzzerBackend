const mongoose = require('mongoose')

const UserCredentials = new mongoose.Schema({
    id: String,
    firstName: String,
    lastName: String,
    username: {type: String},
    password: String,
}) 

module.exports = mongoose.model('UserCredentials', UserCredentials)