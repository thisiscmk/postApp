//importe the Post model file and assigned it to a variable
const Post = require('../models/Post')

//create a exportable property that renders the create post template
exports.viewCreateScreen = function(req, res){
    res.render('create-post', {title: `Create Post`})
}

//create an exportable property that creates a new post and adds it to the database
exports.create = function(req, res){
    let post = new Post(req.body, req.session.user._id) //This variable creates a new object of the constructor function Post in the Post model file with the argument of the user input as well as the user's unique Object ID that the database created for it. It's accessed from the session data
    post.create().then(function(newId){ //the newId argument receives the post id that the create prototype method in the Post model resolves
        req.flash("success", "New Post successfully created")
        req.session.save(() => res.redirect(`/post/${newId}`))
    }).catch(function(err){
        err.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect('/create-post'))
    })
}

// create an exportable property that allows a user to view an author's post by specifying the post id that matches the author's objectId in the database
exports.viewSingle = async function(req, res){
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorId) //visitorId has been instantiated in the app file to confirm that the user is the owner of the post
        res.render('single-post-screen', {post: post, title: post.title})
    }catch{
        res.render('404')
    }
    
}

//create a property that renders the edit-post page with the title and body values of that user's post based on the user's postId
exports.viewEditScreen = async function(req, res){
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        //Kick the user out if they tried access a post when they are not the owner of that post
        if(post.isVisitorOwner){
            res.render('edit-post', {post: post})
        }else{
            req.flash("errors", "You are not allowed to perform this action")
            req.session.save(()=> res.redirect('/'))
        }    
    }catch{
        res.render('404')
    }
}

//create a property that updates the user's edited post to the database
exports.edit = function(req, res){
    let post = new Post(req.body, req.visitorId, req.params.id) //the req.params.id refers to the postId in the url requests
    post.update().then((status) => {
        
        if(status == "success") { // for successful posts
            req.flash("success", "Post successfully updated.")
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })

        }else{ // for verified users who have validation errors
            post.errors.forEach(function(err){
                req.flash("errors", err)
            })
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`) //use backticks to dynamic code to redirect the user back to the edit-post page (based on their postId) so they can try updating again 
            })
        }

    }).catch(() => {
        // for posts whose request id doesn't exist
        //for visitors who are not the owners of the requested post
        req.flash("errors", "You are not allowed to perform this action")
        req.session.save(function(){
            res.redirect('/')
        })
        
    })
}

exports.delete = function(req, res){
    Post.delete(req.params.id, req.visitorId).then(()=> { //req.params.id is the post id found in the url request
        //For logged in users
        req.flash("success", "Post successfully deleted")
        req.session.save(()=> {res.redirect(`/profile/${req.session.user.username}`)})
    }).catch(()=>{
        //For unauthorized users or invalid postIds or inexistent posts
        req.flash("errors", "You're not allowed to perform this action")
        req.session.save(() => res.redirect('/'))
    })
}

exports.search = function(req, res){
    Post.search(req.body.searchTerm).then(posts => {
        res.json(posts)
    }).catch(() => {
        res.json([])
    })
}


// API Properties

//create an api property that creates a new post
exports.apiCreatePost = function(req, res){
    let post = new Post(req.body, req.apiUser._id) 
    post.create().then(function(){ 
        res.json("Congrats")
    }).catch(function(err){
        res.json(err)
    })
}

//create an api property that deletes a user's post based on that post's objectID
exports.apiPostDelete = function(req, res){
    Post.delete(req.params.id, req.apiUser._id).then(()=> {
        res.json("Success")
    }).catch(()=>{
        res.json("You're not authorized to delete a post")
    })
}