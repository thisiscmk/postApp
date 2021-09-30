//To create a database in MongoDB, start by creating a MongoClient object,
const MongoClient = require('mongodb').MongoClient;

//environment variables are variables that contain data which changes depending on the environment your app is running
//example are HTTP Ports and Addresse. Database, cache, and other storage connection information, Location of static files/folders, Endpoints of external services
//You need to create a file called .env that contains all your environment variable (variable names must be in capital letter, no quotes) 
//process.env is an object that contains all environment variables available to the user running the application

//Import npm's .env library
const dotenv = require('dotenv')
dotenv.config() //This will load in all the variable values defined within the .env file

// //specify a connection URL with the correct ip address and the name of the database you want to create.*/
// const connectionString = 'mongodb+srv://cmkAppUser:Kerene394@cluster0.ggemx.mongodb.net/PostApp?retryWrites=true&w=majority'


 
//Start the whole PostApp by opening a connection to the database first

MongoClient.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    module.exports = client //so that this database client can be exported to other model files (Post and Follow)
    
    //import the app file
    const app = require('./app')

    //Tell the app to begin listening for incoming requests port number that is set in the env file
    app.listen(process.env.PORT)
})
