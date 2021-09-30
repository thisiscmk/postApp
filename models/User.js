//This is the model file which contains the blueprint(constructor function) for the username and password objects

//import the validator npm package for email validation checks
const validator = require('validator')

//require the md5 encryption package to hash the emails of user avatars
const md5 = require('md5')

// import the bcrypt package to hash user passwords (install first: npm install bcryptjs)
const bcrypt = require('bcryptjs')

//create a object variable that holds access to the users collection in the mongodb database (PostApp database)
const usersCollection = require('../db').db().collection("users")

let User = function(data, getAvatar){
    this.data = data
    this.errors = [] //this array will store error messages from user input
    if(getAvatar == undefined) {getAvatar = false}
    if(getAvatar) {this.getAvatar()}
}

//Check if user input does not consist of string values
User.prototype.cleanUp = function(){
    if(typeof(this.data.username) != "string"){this.data.username = ""} //This will wipeout whatever username the user inputed
    if(typeof(this.data.email) != "string"){this.data.email = ""} //This will wipeout whatever username the user inputed
    if(typeof(this.data.password) != "string"){this.data.password = ""} //This will wipeout whatever username the user inputed

    //Get rid of any properties that don't exist in our object
    this.data = {
        username: this.data.username.trim().toLowerCase(),  //trim gets rids of empty spaces at the end of a string of text
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.login = function(){
    //return a promise
    return new Promise((resolve, reject) => {
    //Make sure that values are strings of text first
    this.cleanUp() 
    //Search for the user-inputed username in the mongodb database
    usersCollection.findOne({username: this.data.username}).then((confirmedUser) => {
        if(confirmedUser && bcrypt.compareSync(this.data.password, confirmedUser.password)){ //evaluates to true if there's a matching username and hashed password
            //create an avatar for the user once successfully logged in
            this.data = confirmedUser
            this.getAvatar()
            resolve("Congrats")
        }else{
            reject("Invalid username or password")
        }
    }).catch(function(){
        reject("Please try again later")
    })
    })
}

//Create a prototype method that will validate user data
User.prototype.validate = function(){
    return new Promise(async (resolve, reject) => {
        //Check for blank usernames
        if(this.data.username == ""){ this.errors.push("You have to provide a username.") }
        //Check that username only contains letters of the alphabet and numbers (no symbols)
        if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){this.errors.push("Username can only consist of letters and numbers")}
        //Check that emails are in the right format
        if(!validator.isEmail(this.data.email)){ this.errors.push("You have to provide a valid email.") }
        //Check for blank passwords
        if(this.data.password == ""){ this.errors.push("You have to provide a password.") }
        //Check that password length is not less than 12 characters
        if(this.data.password.length > 0 && this.data.password.length < 12){ this.errors.push("Password has to be at least 12 characters") }
        //Check that password length is not more than 100 characters
        if(this.data.password.length > 50){ this.errors.push("Password cannot exceed 50 characters") }
        //Check that username length is at least 3 characters long
        if(this.data.username.length > 0 && this.data.username.length < 3){ this.errors.push("Username has to be at least 3 characters") }
        //Check that username length is not more than 30 characters
        if(this.data.username.length > 100){ this.errors.push("Username cannot exceed 30 characters") }
    
    
        //If username is valid, check if it's already taken
        if(this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
            let usernameExists = await usersCollection.findOne({username: this.data.username})
    
            if(usernameExists){this.errors.push("Username already exists")}
        }
    
        //If email is valid, check if it's already taken
        if(validator.isEmail(this.data.email)){
            let emailExists = await usersCollection.findOne({email: this.data.email})
    
            if(emailExists){this.errors.push("Email already exists")}
        }

        resolve()
    
        
    })
}

//Set a method that will register all new User objects
//All JavaScript objects inherit properties and methods from a prototype
User.prototype.register = function(){
    return new Promise(async (resolve, reject) => {
        //Step 1: Validate user data
        this.cleanUp()
        await this.validate()
    
        //Step 2: Only If there are no validation errors, save user data into a database
        //Make sure that there are no validation errors
        if(!this.errors.length){
            //hash valid user passwords
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
    
            //insert username and password to the database
        await usersCollection.insertOne(this.data)

        this.getAvatar()
        resolve()

        }else{
            reject(this.errors)
        }
    })
}

//Create a prototype method that select a specific profile picture for each user
User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username){
    return new Promise(function(resolve, reject){
        if(typeof(username) != "string"){
            reject()
            return //The empty return prevents further execution of this function
        }

        usersCollection.findOne({username: username}).then(function(userDoc){ //If it finds the username in the database, it receives in the function with the parameter of userDoc
            if(userDoc){ //If it exists (or if it is not empty)
                //use the userDoc parameter to create a new instance of the User blueprint so we can choose the specific values that we want to pass into the controller
                userDoc = new User(userDoc, true) //the true parameter gives me access to the user's avatar via the the getAvatar method
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }

                resolve(userDoc)
            }else{
                reject()
            }
        }).catch(function(){
            reject() //It rejects for any sort of connection problem or unexpected technical error
        })
    })
}

User.doesEmailExist = function(email){
    return new Promise(async function(resolve, reject){
        if(typeof(email) != "string"){
            resolve(false)
            return
        }

        let user = await usersCollection.findOne({email: email})

        if(user){
            resolve(true)
        }else{
            resolve(false)
        }
    })
}


module.exports = User


//I used a package called validator to validate email addresses
//npm install validator