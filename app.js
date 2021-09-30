//This file will contain the server code for this app
//Create a packgage.json that will contain a record of all the packages (modules) that will be used on this app. Run npm init -y on command line
//install express. Run npm install express on command line
//run this file on the browser by typing node app

//Tell the app to use express module for our server
const express = require('express')

//require the sessions package which will tell the server who made the request
const session = require('express-session')

//import the flash package that will display a message in the case of wrong username and/or password 
const flash = require('connect-flash')

//import the markdown package
const markdown = require('marked')

//import the csurf package
const csrf = require('csurf')

//import the sanitizeHTML package
const sanitizeHTML = require('sanitize-html')


//import the MongoDB session store for Express so we can see the session data in the database
const MongoStore = require('connect-mongo')(session)

//Assign the express module to a variable 
const app = express()

//Configure express to add the user submitted data to the request object so that we can access it from the req.body
app.use(express.urlencoded({extended: false}))
//Configure express to read json data
app.use(express.json())

//configure the express app to use a separate router for api routes
app.use('/api', require('./router-api'))

let sessionOptions = session({
    secret: "Javascript is awesome",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})





//configure the app variable to use sessions
app.use(sessionOptions)

//configure the app variable to use flash
app.use(flash())

//create a middleware function to make the session data dynamic for all controllers (user, port and follow)
//res.locals is an object that will be available within all the views templates
//This makes the user property available to all ejs templates 
app.use(function(req, res, next){

    //make the markdown function available from within ejs templates
    res.locals.filterUserHTML = function(content){
        return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
    }

    // make error and success flash messages available from all templates
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")
    
    //make current user id available on the req object
    if(req.session.user){ //If a session exists for the user 
        req.visitorId = req.session.user._id //Assign that user's id to a visitorId property 
    }else{ //if there is no recorded session for that user (if user is a guest)
        req.visitorId = 0 //set the visitorId property to 0
    }
    //make user session data avalable from within views templates
    res.locals.user = req.session.user
    next()
})

//Set a path to the router javascript file
const router = require('./router')
console.log(router)




//make the public folder accessible to express
app.use(express.static('public'))

//Set express to render the views html file
//the second views is a configuration variable that sets folder from which express will grab templates.
app.set('views', 'views')

//set the template engine that express will use 
//A template engine enables you to use static template files in your application.
app.set('view engine', 'ejs') //make sure to install ejs on cli (npm install ejs)

//tell the express app to use the csurf package
app.use(csrf())

//create a middleware function that will make the csrf token available from all ejs templates
app.use(function(req, res, next){
    res.locals.csrfToken = req.csrfToken()
    next()
})

//Tell the express app to use the router created in router.js
app.use('/', router)

//configure the express app to display a flash error message for post requests that don't have a csrf token
app.use(function(error, req, res, next){
    if(error){
        if(error.code == "EBADCSRFTOKEN"){ //if the error is related to the csrf token not being a match
            req.flash('errors', "Cross site request forgery detected")
            req.session.save(()=> res.redirect('/'))
        }else{
            res.render('404')
        } 
    }
})

//Configure the server to also power socket connection and not just express
const server = require('http').createServer(app)
const io = require('socket.io')(server)
//configure code to make express data available from within socket.io
io.use(function(socket, next){
    sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket){
    if(socket.request.session.user){ //only if a user is logged in to the web browser
        let user = socket.request.session.user

        //store the user's username and avatar in memory when a connection is created
        socket.emit("welcome", {username: user.username, avatar: user.avatar})
        //receive the chatMessageFromBrowser event
        socket.on('chatMessageFromBrowser', function(data){ //data receives the text from the chatMessageFromBrowser event
            // send/emit that text to all connected browsers along with the username and the avatar of the user who wrote the message
            // sanitize that text from all potential script attacks
            socket.broadcast.emit('chatMessageFromBrowser', {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar}) 

    })
    }
})

module.exports = server //export the server file to the db file so that the database can create a connection first before the app starts listening for requests 

