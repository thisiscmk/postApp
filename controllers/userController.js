//import the User model that defines the constructor function for the username
const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')
const jwt = require('jsonwebtoken')

exports.sharedProfileData = async function(req, res, next){ //next will move on to the next property in the route

let isVisitorsProfile = false
//check is visitor is already following the profile that they're visiting
let isFollowing = false
//if user is logged in
if(req.session.user){
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
    //verifying if the user is following the person whose profile they're visiting
   isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
}

req.isVisitorsProfile = isVisitorsProfile
//Assign that value (true/false) to the request object
req.isFollowing = isFollowing
//retrieve post, follower and following counts
let postCountPromise =  Post.countPostsByAuthor(req.profileUser._id)
let followerCountPromise =  Follow.countFollowerById(req.profileUser._id)
let followingCountPomise =  Follow.countFollowingById(req.profileUser._id)

let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPomise])

req.postCount = postCount
req.followerCount = followerCount
req.followingCount = followingCount

//proceed with the next property in the route
next()
}
exports.mustBeLoggedIn = function(req, res, next){
    if(req.session.user){
        next()
    }else{
        req.flash("errors", "You must be logged in to perform this action")
        req.session.save(function(){
            res.redirect('/')
        })
    }
}

exports.login = function(req, res){
    let user = new User(req.body)
    user.login().then(function(result){
        //create a unique session object for each browser visitor()
        req.session.user= {avatar: user.avatar, username: user.data.username, _id: user.data._id} //_id property stores the user's object ID (found in the database) when he logs in, into the session data
        //if the promise function in the User model is successful, return the home-dashboard message
        //Before redirecting, create a function that will save the new session data then callback the redirect function
        req.session.save(function(){
            res.redirect('/')
        })
    }).catch(function(err){
        //add the flash object into the request object with error message
        req.flash('errors', err)
        //redirect the user back to the home page
        req.session.save(function(){
            res.redirect('/')
        })
        
    })
    
}

exports.logout = function(req, res){
    //destroys (remove) that existing cookie from the incoming http request in the database
    //create a function that will save the new session data then callback the redirect function
    req.session.destroy(function(){
        res.redirect('/')
    })

}

exports.register = function(req, res){
    //create an object to represent the form submitted by the visitor
    let user = new User(req.body)
    user.register().then(()=>{
        req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id} //_id property stores the user's object ID (found in the database) when he registers, into the session data
        req.session.save(function(){
            res.redirect('/')
        })        
    }).catch((regErrors)=>{
        regErrors.forEach(function(err){ //If yes, display that error as a flash message
            req.flash('registrationErrors', err)
        }) 

        req.session.save(function(){
            res.redirect('/')
        })
    })

}

exports.home = async function(req, res){
    if(req.session.user){
        //retrieve list of posts from the people that the user follows
        let posts = await Post.getFeed(req.session.user._id)
        res.render('home-dashboard', {posts: posts, title: `Home Feed`})
    }else{
        res.render('home-guest', {regErrors: req.flash('registrationErrors')})
    }
}

//For profile page, first check if the user exists
exports.ifUserExists = function(req, res, next){
    User.findByUsername(req.params.username).then(function(userDocument){
        req.profileUser = userDocument //created a new property on the request object that will be used in the profilePostsScreen property
        next()
    }).catch(function(){
        res.render('404', {title: 'Error'})
    })

    
}

//Then create a property to render the profile ejs template
exports.profilePostsScreen = function(req, res){

    //Ask the post model for posts by a certain author id then render the profile page with the user's username, avatar and their post(s)
    Post.findByAuthorId(req.profileUser._id).then(function(posts){ //This method will resolve with an array of user created posts
        
        res.render('profile', {
            title: `${req.profileUser.username.charAt(0).toUpperCase() + req.profileUser.username.slice(1)}`,
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })

    }).catch(function(){
        
        res.render('404')
    })

    
}

//Create a property to check the followers that the user has based on their userIds
exports.profileFollowersScreen = async function(req, res){
     try{
        let followers = await Follow.getFollowersById(req.profileUser._id)
        res.render('profile-followers', {
        currentPage: "followers",
        followers: followers,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })

     }catch{
        res.render('404')               
         
     }
}

//Create a property to check the followings that the user 
exports.profileFollowingScreen = async function(req, res){
    try{
       let following = await Follow.getFollowingById(req.profileUser._id)
       res.render('profile-following', {
       currentPage: "following",    
       following: following,
       profileUsername: req.profileUser.username,
       profileAvatar: req.profileUser.avatar,
       isFollowing: req.isFollowing,
       isVisitorsProfile: req.isVisitorsProfile,
       counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
   })

    }catch{
       res.render('404')               
        
    }
}

//create a property that responds to the axios request to check if a username already exists
exports.doesUsernameExist = function(req, res){
    User.findByUsername(req.body.username).then(function(){
        res.json(true)
    }).catch(function(){
        res.json(false)
    })
}

//create a property that responds to the axios request to check if a email already exists
exports.doesEmailExist = async function(req, res){
    let emailBoolean = await User.doesEmailExist(req.body.email)
    res.json(emailBoolean)
}


//API Properties

//create a property that responds to the router-api's post request for login
exports.apiLogin = function(req, res){
    let user = new User(req.body)
    user.login().then(function(){
        //once login is successful, create a new token for the user (session id)
        res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '7d'}))
    }).catch(function(){
        res.json("Sorry dude, you're out")
        
    })
    
}

//create a property that confirms if the user is logged in by verifying the token and secret
exports.apiMustBeLoggedIn = function(req, res, next){
    try{
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
        next()
    }catch{
        res.json("Sorry you need to provide a valid token")
    }
}

//created a property that return an array of a user's posts based on their username
exports.apiGetPostsByUsername = async function(req, res){
    try{
        //create a variable that finds the user in the users collection within the database
        let authorDoc = await User.findByUsername(req.params.username)
        //create a variable that will store an array of that user's posts from within the posts collection in the database
        let posts = await Post.findByAuthorId(authorDoc._id)
        //display that array in the API
        res.json(posts)
    }catch{
        res.json("Sorry, wrong user request")
    }
}


