const JWT = require('jsonwebtoken')

const AUTH_FUNCS = {
    HasToken(req, res, next){
        const HeaderBearer = req.headers['authorization']
        if(typeof HeaderBearer !== 'undefined'){
            const Bearer = HeaderBearer.split(' ')
            const BearerToken = Bearer[1]
            req.token = BearerToken
            next()
        }else{
            res.sendStatus(403)
        }
    },

    VerifyToken(req, res, next){
        JWT.verify(req.token, 'secret', (err, data) => {
            if(err) return res.sendStatus(403)
            next()
        })
    }
}

module.exports = AUTH_FUNCS