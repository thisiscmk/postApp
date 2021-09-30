//import the users collection(table) from the database and assigned it to a variable
const usersCollection = require('../db').db().collection("users")
//create a new collection(table) for followings in the database and assigned it to a variable
const followsCollection = require('../db').db().collection("follows")

const ObjectId = require('mongodb').ObjectId
const User = require('./User')

//create a constructor function(class) with the username of the new person to follow and the user's own authorId as parameters
let Follow = function(followedUsername, authorId){
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

//create a prototype method to clean up any input errors
Follow.prototype.cleanUp = function(){
    if(typeof(this.followedUsername) != "string") {this.followedUsername = ""}
}

//create a prototype method to perform validation checks
Follow.prototype.validate = async function(action){
    //followedUsername must exist in the database
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if(followedAccount){ //if the account that the user wants to follow exists in the users collection
        this.followedId = followedAccount._id
    }else{
        this.errors.push("You cannot follow a user that does not exist")
    }

    let doesFollowAlreadyExist = await followsCollection.findOne({followingId: this.followedId, followerId: new ObjectId(this.authorId)})

    if(action == "create"){
        if(doesFollowAlreadyExist){ this.errors.push("You already follow this user") }
    }

    if(action == "delete"){
        if(!doesFollowAlreadyExist){ this.errors.push("You cannot stop following a user that you do not already follow ") }
    }

    // user should not be able to follow themselves
    if(this.followedId.equals(this.authorId)){
        this.errors.push("You can not follow yourself")
    }

}

//create a prototype method that creates a new follow object in the database with user's authorId and the id of the person that they want to follow
Follow.prototype.create = function(){
    return new Promise(async (resolve, reject)=>{
        this.cleanUp()
        await this.validate("create")
        if(!this.errors.length){ //If there are no errors
            await followsCollection.insertOne({followingId: this.followedId, followerId: new ObjectId(this.authorId)})
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

//create a prototype method that deletes an existing follow object in the database 
Follow.prototype.delete = function(){
    return new Promise(async (resolve, reject)=>{
        this.cleanUp()
        await this.validate("delete")
        if(!this.errors.length){ //If there are no errors
            await followsCollection.deleteOne({followingId: this.followedId, followerId: new ObjectId(this.authorId)})
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

//create a method that checks if the user follows the person's whose page they're visiting
Follow.isVisitorFollowing = async function(followedId, visitorId){

    //verify that the person whose profile the user is visiting is the same person that the user is following according to the database
    let followDoc = await followsCollection.findOne({followingId: followedId, followerId: new ObjectId(visitorId)})
    if(followDoc){
        return true
    }else{
        return false
    }
}

//create a method that finds and returns the followers of a user 
Follow.getFollowersById = function(id){
    return new Promise(async (resolve, reject) => {
        try{
            //Perform a lookup to match the user(followingId) to their follower's(followerId) username and email in the database
             
            let followers = await followsCollection.aggregate([
                {$match: {followingId: id}},
                {$lookup: {from: "users", localField: "followerId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            //Now that I have their email, return that follower(authorId)'s username plus their avatar from the retrieved email
            followers = followers.map(function(follower){
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })
            resolve(followers)
        }catch{
            reject()
        }
    })
}


//create a method that finds and returns the following of a user 
Follow.getFollowingById = function(id){
    return new Promise(async (resolve, reject) => {
        try{
            //Perform a lookup to match the user(followerId) to their following's(followingId) username and email in the database
             
            let following = await followsCollection.aggregate([
                {$match: {followerId: id}},
                {$lookup: {from: "users", localField: "followingId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            //Now that I have their email, return that following(followingId)'s username plus their avatar from the retrieved email
            following = following.map(function(follower){
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })
            resolve(following)
        }catch{
            reject()
        }
    })
}

//create a method that counts the number of followers a user has
Follow.countFollowerById = function(id){
    return new Promise(async(resolve, reject)=>{
        let followerCount = await followsCollection.countDocuments({followingId: id})
        resolve(followerCount)
    })
}

//create a method that counts the number of followings a user has
Follow.countFollowingById = function(id){
    return new Promise(async(resolve, reject)=>{
        let count = await followsCollection.countDocuments({followerId: id})
        resolve(count)
    })
}



module.exports = Follow