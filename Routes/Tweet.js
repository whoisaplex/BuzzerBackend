const express = require('express')
const Router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const TOKEN_AUTH = require('../Globals/TOKEN_AUTH')

const Tweets = require('../Models/Tweets')
const Users = require('../Models/Users')
const Comments = require('../Models/Comments')

//Get Buzzes depending on userId
Router.get('/', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const username = req.query.username
    const userid = req.query.userid
    const offset = parseInt(req.query.offset) || 0

    Tweets
    .find({creatorUsername: username})
    .limit(5)
    .skip(offset)
    .sort({created: -1})
    .lean()
    .exec((err, Buzzes) => {
        Buzzes = LikesFormat(Buzzes, userid)
        Buzzes = isOwner(Buzzes, 'creatorID', userid)
        res.send(TimeFormat(Buzzes))
    })
})

//Get Buzzes depending on who you follow
Router.get('/feed', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const user_id = req.query.user_id
    const offset = parseInt(req.query.offset) || 0
    
    Users.findOne({id: user_id})
    .select('following -_id')
    .exec((error, document) => {
        let following = document.following
        following = [user_id, ...following]
        Tweets.find({'creatorID': { $in: following}})
            .limit(6)
            .skip(offset)
            .sort({'created': -1})
            .lean()
            .exec((error, Buzzes) => {
                Buzzes = LikesFormat(Buzzes, user_id)
                Buzzes = isOwner(Buzzes, 'creatorID', user_id)
                res.send(TimeFormat(Buzzes)).status(200)
        })
    })
})

//Post a new Buzz
Router.post('/Tweet', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const User = req.body
    const Tweet = new Tweets(TweetConstructor(User))
    Tweet.save((err, tweet) => {
        if(err) return console.log(err)
        let TempBuzzArray = TimeFormat([tweet.toObject()])
        TempBuzzArray = LikesFormat(TempBuzzArray, 0)
        
    Users.findOne({username: User.Username}).exec((err, UserDoc) => {
        if(UserDoc){
            UserDoc.buzzers += 1
            UserDoc.save(err => {
                res.send(TempBuzzArray[0])
            })
        }
    })
    })
})

Router.post('/Rebuzz', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const BuzzData = req.body
    const Rebuzz = new Tweets(RebuzzConstructor(BuzzData))
    //Save the created Rebuzz
    Rebuzz.save((err, rebuzz) => {
        if(err) return console.log(err)
        let TempBuzzArray = TimeFormat([rebuzz.toObject()])
        TempBuzzArray = LikesFormat(TempBuzzArray, 0)
        //Update the current users Rebuzz count
        Users.findOne({username: BuzzData.creatorUsername}).exec((err, UserDoc) => {
            if(UserDoc){
                UserDoc.rebuzzers += 1
                UserDoc.save(err => {
                    //Update the original buzz creator's buzz - rebuzz count
                    Tweets.findOne({ id: BuzzData.OGBuzzId }).exec((error, result) => {
                        result.retweets += 1
                        result.save(error => {
                            res.send(TempBuzzArray[0])
                        })
                    })
                })
            }
        })
    })
})

Router.delete('/deleteBuzz', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const Buzz_id = req.body.id
    const User_id = req.body.user_id
    Tweets.deleteOne({id: Buzz_id}, (err, result) => {
    Users.findOne({id: User_id}).exec((err, UserDoc) => {
        UserDoc.buzzers -= 1
        UserDoc.save(err => {
            Comments.deleteMany({BuzzId: Buzz_id}, (error, response) => {
                res.sendStatus(200)
            })
        })
    })
    })
})

Router.delete('/deleteRebuzz', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const {id, ogId, userId} = req.body
    Tweets.deleteOne({id: id}).exec((error, response) => {
        if(error) return res.sendStatus(500)
        Users.findOne({id: userId}).exec((error2, User) => {
            if(error2) return res.sendStatus(500)
            User.rebuzzers -= 1
            User.save(error3 => {
                if(error3) return res.sendStatus(500)
                Tweets.findOne({id: ogId}).exec((error4, Buzz) => {
                    Buzz.retweets -= 1
                    Buzz.save(error4 => {
                        if(error4) return res.sendStatus(500)
                        Comments.deleteMany({BuzzId: id}).exec((error5, response2) => {
                            if(error5) return res.sendStatus(500)
                            res.sendStatus(200)
                        })
                    })
                })
            })
        })
    })
})

Router.post('/likeBuzz', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const {userid, Buzzid} = req.body
    Tweets.updateOne({id: Buzzid}, { $push: { likes: userid }}, (error, success) => {
        if(error) return res.sendStatus(404)
        res.sendStatus(200)
    })
})

Router.post('/unlikeBuzz', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const {userid, Buzzid} = req.body
    Tweets.updateOne({id: Buzzid}, { $pull: { likes: userid }}, (error, success) => {
        if(error) return res.sendStatus(404)
        res.sendStatus(200)
    })
})

Router.get('/comments', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const BuzzId = req.query.BuzzId
    const UserId = req.query.UserId

    Comments.find({ BuzzId })
    .sort({'created': -1})
    .lean()
    .exec((error, Comments) => {
        if(error) return res.sendStatus(500)
        const isOwnerComments = isOwner(Comments, "creatorID", UserId)
        res.send(TimeFormat(isOwnerComments))
    })
})

Router.post('/comments', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const req_comment = req.body
    const Comment = new Comments(CommentConstructor(req_comment))
    Comment.save((error, Comment) => {
        if(error) return res.sendStatus(500)
        Tweets.updateOne({id: req_comment.BuzzId}, { $inc: { comments: 1 }})
        .exec((error, result) => {
            const isOwnerComments = isOwner([Comment.toObject()], "creatorID", req_comment.CreatorId)
            res.send(TimeFormat(isOwnerComments)).status(200)
        })
    })
})

Router.delete('/comments', TOKEN_AUTH.HasToken, TOKEN_AUTH.VerifyToken, (req, res) => {
    const req_commentId = req.body.commentId
    const req_BuzzId = req.body.BuzzId

    Comments.deleteOne({id: req_commentId}, (err, result) => {
        if(err) return res.sendStatus(500)
        Tweets.updateOne({id: req_BuzzId}, { $inc: { comments: -1 }})
        .exec((error, result) => {
            if(error) return res.sendStatus(500)
            res.send(req_commentId)
        })
    })
})

module.exports = Router

//Reformat the time of the tweet
function TimeFormat(Tweets){
    let nDate = new moment()
    
    let NewTweets = Tweets.map(Tweet => {
        let TweetDate = moment(Tweet.created)
        let duration = moment.duration(nDate.diff(TweetDate))

        if(duration.asSeconds() < 60){
            Tweet.created = 'Just now'
        }else if(duration.asSeconds() >= 60 && duration.asMinutes() <= 60){
            Tweet.created = (Math.floor(duration.asMinutes()) + ' Minutes ago')
        }else if(duration.asMinutes() > 60 && duration.asHours() < 24){
            Tweet.created = (Math.floor(duration.asHours()) + ' Hours ago')
        }else{
            Tweet.created = TweetDate.format('DD MMM YYYY')
        }
        return Tweet
    })
    return NewTweets
}

//Constructing a new Tweet
function TweetConstructor(User){
    return {
        id: mongoose.Types.ObjectId(),
        creatorID: User.UserID,
        creatorName: User.Fullname,
        creatorUsername: User.Username,
        created: new moment().format('YYYY-MM-DDTHH:mm:ssZ'),
        content: User.content,
        likes: [],
        comments: 0,
        retweets: 0
    }
}

function RebuzzConstructor(BuzzData){
    return {
        id: mongoose.Types.ObjectId(),
        creatorID: BuzzData.creatorID,
        creatorName: BuzzData.creatorName,
        creatorUsername: BuzzData.creatorUsername,
        created: new moment().format('YYYY-MM-DDTHH:mm:ssZ'),
        content: BuzzData.content,
        likes: [],
        comments: 0,
        isRebuzz: BuzzData.isRebuzz,
        OGBuzzId: BuzzData.OGBuzzId,
        OGCreatorName: BuzzData.OGCreatorName,
        OGCreatorUsername: BuzzData.OGCreatorUsername,
        OGContent: BuzzData.OGContent
    }
}

//Constructing a new Comment
function CommentConstructor(Comment){
    return {
        id: mongoose.Types.ObjectId(),
        BuzzId: Comment.BuzzId,
        creatorID: Comment.CreatorId,
        creatorName: Comment.CreatorName,
        creatorUsername: Comment.CreatorUsername,
        created: new moment().format('YYYY-MM-DDTHH:mm:ssZ'),
        content: Comment.content
    }
}

//Checks wether you have liked a Buzz or not
function LikesFormat(Buzzes, id){
    return Buzzes.map(Buzz => {
        const TempBuzz = Buzz
        TempBuzz.likeSize = Buzz.likes.length
        TempBuzz.hasLiked = Buzz.likes.includes(id)
        return TempBuzz
    })
}

//Checks wether you are the owner of a comment or not
function isOwner(arrObjects, objectIdString, UserId){
    return arrObjects.map(item => {
        if(item[objectIdString] === UserId){
            item.isOwner = true
        }else{
            item.isOwner = false
        }
        return item
    })
}