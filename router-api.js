const apiRouter = require('express').Router()
const cors = require('cors') //cors (cross origin resource sharing) allows other domains/applications/environments to send asynchronous requests to your API

//configure all the routes to use cors so that any domain can send requests to the API
apiRouter.use(cors())

//import the controllers
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

//create a route that lets a user login from  the api
apiRouter.post('/login', userController.apiLogin)
//create a route that lets a user create a new post from  the api
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreatePost)
//create a route that lets a user delete a post from  the api
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiPostDelete)
//create a route that lets a user view a list of posts from an author, from  the api
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername)

module.exports = apiRouter