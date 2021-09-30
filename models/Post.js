/*
    Author: CMK
    Date: September 2021

*/

//create a variable that creates a new database table to store user posts
const postsCollection = require('../db').db().collection("posts")
//create a variable that holds access to the follows collection in the database
const followsCollection = require('../db').db().collection("follows")

//import the sanitizeHTML package that get rid of any javascript tags or html attributes in the html content on the frontend
const sanitizeHTML = require('sanitize-html')

const ObjectId = require('mongodb').ObjectId;

//require the User model
const User = require('./User')

//Create a constructor function that receives the req.body(post input from the user in the template ) as an argument
let Post = function(data, userID, requestedPostId){
    this.data = data  //assignns the req.body data to the constructor function
    this.errors = [] //array that will hold any validation errors
    this.userID = userID //assigns the user objectID to the constructor function
    this.requestedPostId = requestedPostId
}

//This method makes sure that the user input only consists of strings
Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){this.data.title = ""}
    if(typeof(this.data.body) != "string"){this.data.body = ""}

    //get rid of any extra or undesired content that the user adds by specifying what the post object should consist of before it's sent to the database
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}), 
        createdDate: new Date(),
        author: ObjectId(this.userID) //This property attaches the post to the user who created it by storing the user's objectID to the post database as author
    }
}

//This method makes sure that the title and body fields aren't empty 
Post.prototype.validate = function(){
    if (this.data.title == ""){this.errors.push("Please to provide a title")}
    if (this.data.body == ""){this.errors.push("Please provide post content")}
}

//This method will insert the user created post in the database 
//This method returns a promise
Post.prototype.create = function(){
    return new Promise((resolve, reject)=>{
        this.cleanUp()
        this.validate()

        if(!this.errors.length){ //checks if the errors array is empty (if there are no validation errors)

            //insert post into the database
            postsCollection.insertOne(this.data).then((info)=>{
                resolve(info.ops[0]._id) //passes the newly created post's id from the database into the promise
            }).catch(()=>{
                this.errors.push("Please try again later")
                reject(this.errors)
            })

        }else{
            reject(this.errors)
        }
    })
}

Post.prototype.update = function(){
    return new Promise(async (resolve, reject) => {
        try{
            let post = await Post.findSingleById(this.requestedPostId, this.userID)
            if(post.isVisitorOwner){
                //update the db
                let status = await this.actuallyUpdate()
                resolve(status)
            }else{
                reject()
            }
        }catch{
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length){ //if there are no validation errors
            await postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
            resolve("success")
        }else{
            resolve("failure")
        }
    })
}

//This method will will perform a lookup to match the user to a database and will be reused twice
Post.reusablePostQuery = function(uniqueOperations, visitorId, finalOperations = []){
    return new Promise(async function(resolve, reject) {
        //Aggregate is a method that allows you to perform multiple operations
        //It is also used to perform a lookup in the mongodb database
        //The lookup will return an array of the matched objects found in the database
        let aggregateOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: { //project allows you to specify the fields that you want the returning object (authorDocument) to have
                title: 1,
                body: 1, 
                createdDate: 1,
                authorId: "$author", //A dollar sign specifies the field on the database
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ]).concat(finalOperations)


        
        let posts = await postsCollection.aggregate(aggregateOperations).toArray()

        // filter the author property in each post object to only return the username and avatar
        posts = posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorId)
            //once the user is confirmed, hide the post authorId from the frontend javascript
            post.authorId = undefined
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }

            return post
        })

        resolve(posts)
    })
}

//reuse the reusablePostQuery to perform a lookup in the database based on the user's ObjectId
Post.findSingleById = function(id, visitorId){
    return new Promise(async function(resolve, reject) {
        //validate that the id that the user adds in the url is a string as well as a valid objectId string 
        if(typeof(id) != "string" || !ObjectId.isValid(id)){
            reject()
            return
        }

       let posts = await Post.reusablePostQuery([
           {$match: {_id: new ObjectId(id)}} //This tells the lookup operation found in the reusablePostQuery method to match and display the post in the database if the user types in an authorId that matches an authorId in the database
       ], visitorId)
        if(posts.length){
            console.log(posts[0])
            resolve(posts[0])
        }else{
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId){
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}} //This sort object property will sort the user created posts based on the date they were created. The value 1 sorts in ascending order and -1 sorts in descending order
    ])
}

Post.delete = function(postIdToDelete, currentUserId){
    return new Promise(async (resolve, reject) =>{
        try{
            let post = await Post.findSingleById(postIdToDelete, currentUserId)
            
            if(post.isVisitorOwner){
                //for authorized users
                await postsCollection.deleteOne({_id: new ObjectId(postIdToDelete)})
                resolve()
            }else{
                //for unathorized users trying to delete a post
                reject()
            }
        }catch{
            //for invalid postId, or posts that dont exist in the database
            reject()
        }
    })
}

//create a method that searches in the database for the post that user types in the search input field
Post.search = function(searchTerm){
    return new Promise(async (resolve, reject) => {
        if(typeof (searchTerm) == "string"){
            //looks for any text in the post database that matches the user's search text
            //sort the posts by relevancy score to return the best match for the search term
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}} 
            ], undefined, [{$sort: {score: {$meta: "textScore"}}} ]) 
            resolve(posts)
        }else{
            reject()
        }
    })
}

//Create a method to count the number of posts from each user
Post.countPostsByAuthor = function(id){
    return new Promise(async(resolve, reject)=>{
        let postCount = await postsCollection.countDocuments({author: id})
        resolve(postCount)
    })
}


//create a method that gets the post(s) from all the people that the user follows
Post.getFeed = async function(id){
    // create an array of the user ids that the current user follows
    let followedUsers = await followsCollection.find({followerId: new ObjectId(id)}).toArray()
    
    followedUsers = followedUsers.map(function(followDoc){
        return followDoc.followingId
    })
    // look for posts that match those user ids and sort from the latest to oldest

    return Post.reusablePostQuery([
        {$match: {author: {$in: followedUsers}}},
        {$sort: {createdDate: -1}}
    ])
}

module.exports = Post