const mongoose = require('mongoose')
const express = require('express')
const app = express()
const cors = require('cors')

const PORT = process.env.PORT || 3000

mongoose.connect('mongodb://localhost:27017/Twitter', {useNewUrlParser: true})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

//Routes
app.use('/', require('./Routes/Tweet'))
app.use('/users', require('./Routes/Users'))
app.use('/userCredentials', require('./Routes/UserCredentials'))
app.use('/messages', require('./Routes/Conversations'))

app.listen(PORT, () => {
    console.log('Application is running')
})