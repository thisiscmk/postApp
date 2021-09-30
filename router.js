//This file will hold the list of all of the routes of this app 
//Tell the router file to use express module for our server
const express = require('express')
 

//create the router variable that will return the built in router from express
const router = express.Router()

//create a variable that will import the functions from the userController javascript file
const userController = require('./controllers/userController')
//create a variable that will import the functions from the postController javascript file
const postController = require('./controllers/postController')
//create a variable that will import the functions from the followController javascript file
const followController = require('./controllers/followController')

//Home page route

//set the get request to return the home function for the controller file
router.get('/', userController.home)


//Login, Logout, Register routes

//set the register form post request to return the register function from the controller file
router.post('/register', userController.register)
//create a route for the login form post request using the url set on the html line 29 in header.ejs file. 
//Make it return the login function in the userController file
router.post('/login', userController.login)
//create a route for the signout (logout) form post request using the url set on the html line 24 in header.ejs file.
//Make it return the logout function in the userController file
router.post('/logout', userController.logout)
//create a route for the axios request to the server to check if a username exists
router.post('/doesUsernameExist', userController.doesUsernameExist)
//create a route for the axios request to the server to check if an email exists
router.post('/doesEmailExist', userController.doesEmailExist)

//Posts routes

//create a route for the create post button that renders the create-post template 
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)
//create a route for the save new post button that renders the template
router.post('/create-post', userController.mustBeLoggedIn, postController.create)
//create a route that renders the user created posts (single-post-screen template) based on the user's id
router.get('/post/:id', postController.viewSingle)
//create a route that allows a logged in user to view the edit-post template with their post values pulled from the database
router.get('/post/:id/edit', userController.mustBeLoggedIn ,postController.viewEditScreen)
//create a route that allows a logged in user to submit the edited values to the database
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit)
//create a route for the delete button that allows a logged in user to delete their post
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete)

//Profile routes

//create a route for the user's profile based on the user's username
router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData, userController.profilePostsScreen)
//create a route for the user's followers page 
router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowersScreen)
//create a route for the user's following page
router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowingScreen)

//Search route

//create a route for the axios request with the values from the search field
router.post('/search', postController.search)

//Follow routes

//create a post route for logged in users to follow each other
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow)
//create a post route for logged in users to unfollow each other
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow)

module.exports = router