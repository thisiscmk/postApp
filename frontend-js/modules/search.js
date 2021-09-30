import axios from 'axios'
import DOMPurify from 'dompurify'

export default class Search {
    //Select DOM elements and keep track of useful data
    constructor(){
        this.injectHTML()
        this.headerSearchIcon = document.querySelector(".header-search-icon") //this property holds the search overlay feature (class)
        this.overlay = document.querySelector(".search-overlay") //this property holds the search overlay feature (class)
        this.closeIcon = document.querySelector(".close-live-search") //this property holds the close icon class in the search field
        this.inputField = document.querySelector("#live-search-field") //this property holds the html search field class
        this.resultsArea = document.querySelector(".live-search-results") // this property holds the html that displays the search resutls
        this.loaderIcon = document.querySelector(".circle-loader") //this property holds the circle loader feature (class)
        this.typingWaitTimer //this property will wait for a while after the user has typed before sending a server request
        this.previousValue = ""
        this._csrf = document.querySelector('[name="_csrf"]').value //this property stores the csrf token value from the hidden input element within the header template for logged in users
        //call the events methods
        this.events()
    }

    //Events
    events(){
        //create an eventListener that listens for a click on the search icon
        this.headerSearchIcon.addEventListener("click", (e) => {
            e.preventDefault()
            this.openOverlay()
        })
        //create an eventListener that listens for a click on the search close icon
        this.closeIcon.addEventListener("click", () => this.closeOverlay())
        //create an eventListener that listens for when a user types in text within the search input field
        this.inputField.addEventListener("keyup", () => this.keyPressHandler())
    }


    //Methods

    keyPressHandler(){
        let value = this.inputField.value
        //If the user deletes text from the search input field 
        if(value == ""){
            //reset the axios request countdown time
            clearTimeout(this.typingWaitTimer)
            //remove the loader icon
            this.hideLoaderIcon()
            //remove the the search results
            this.hideResultsArea()
        }
        //If the user starts typing new text
        if(value != "" && value != this.previousValue){
            //restart the countdown time
            clearTimeout(this.typingWaitTimer)
            //show the loading icon
            this.showLoaderIcon()
            //remove any search result until the user is done typing
            this.hideResultsArea()
            //Once user is done, start a countdown of 3 seconds before sending an axios request to the server with the user's values
            this.typingWaitTimer = setTimeout(() => this.sendRequest(), 750)
        }
        this.previousValue = value
    }

    //Send a request to the server with values from the search input field
    sendRequest(){
        axios.post('/search', {_csrf: this._csrf, searchTerm: this.inputField.value}).then((response)=>{
            console.log(response.data)
            //Receive the json data from the database object and render it in the search result html
            this.renderResultsHTML(response.data)
        }).catch(()=>{
            alert("Request failed")
        })
    }

    //create a method that renders an array of json data from the database into the search result html
    renderResultsHTML(posts){
        if(posts.length){ //If the array has any item
            this.resultsArea.innerHTML = DOMPurify.sanitize(`<div class="list-group shadow-sm">
            <div class="list-group-item active"><strong>Search Results</strong> (${posts.length>1 ? `${posts.length} items found`: '1 item found'} )</div>
            ${posts.map((post)=>{
                let postDate = new Date(post.createdDate)
                return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
                <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
                <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth() + 1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
              </a>`
            }).join('')}
            
          </div>`)
        }else{
            //If the array is empty, return a no results found message
            this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Sorry, we could not find any result for that post</p>`
        }
        this.hideLoaderIcon()
        this.showResultsArea()
    }
    //show the loader icon when the user types in text in the search input field
    showLoaderIcon(){
        this.loaderIcon.classList.add("circle-loader--visible")
    }

    //hide the loader icon once a search has been completed in the database
    hideLoaderIcon(){
        this.loaderIcon.classList.remove("circle-loader--visible")
    }

    showResultsArea(){
        this.resultsArea.classList.add("live-search-results--visible")
    }

    hideResultsArea(){
        this.resultsArea.classList.remove("live-search-results--visible")
    }

    //Make the overlay (search box) visible when the search icon is clicked
    openOverlay(){
        this.overlay.classList.add("search-overlay--visible")
        setTimeout(() => this.inputField.focus(), 50) //This places a cursor on the search inputfield as soon as the search icon is clicked
    }
    //Remove the overlay (search box) when the search close icon is clicked
    closeOverlay(){
        this.overlay.classList.remove("search-overlay--visible")
    }

    //add the search html code that shows during click events
    injectHTML(){
        document.body.insertAdjacentHTML('beforeend', `<!-- search feature begins -->
        <div class="search-overlay">
          <div class="search-overlay-top shadow-sm">
            <div class="container container--narrow">
              <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
              <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
              <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
            </div>
          </div>
      
          <div class="search-overlay-bottom">
            <div class="container container--narrow py-3">
              <div class="circle-loader"></div>
              <div class="live-search-results"> </div>
            </div>
          </div>
        </div>
        <!-- search feature end -->`)
    }

}