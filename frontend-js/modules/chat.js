import DOMPurify from "dompurify"

export default class Chat {
    constructor(){
        //create a property that checks if the chat box is opened yet
        this.openedYet = false
        //create a constructor property that holds access to the chat wrapper div in the footer based on its div id
        this.chatWrapper = document.querySelector("#chat-wrapper") //# selects an element based on its Id (. selects an element based on its class)
        //create a property that holds access to the chat icon in the header
        this.openIcon = document.querySelector(".header-chat-icon")
        //Call the method that displays the chat box html 
        this.injectHTML()
        //create a property that selects the chat area where all chat messages are displayed
        this.chatLog = document.querySelector("#chat")
        //create a property that selects the text field id in the chat box html
        this.chatField = document.querySelector("#chatField")
        //create a property that selects the form id that the text field is wrappen in, in the chat box html
        this.chatForm = document.querySelector("#chatForm")
        //create a property that holds access to the chat box's close icon html class
        this.closeIcon = document.querySelector(".chat-title-bar-close")
        
        //Call the events that listen for movement on the browser end
        this.events()
    }


    //Events
    events(){
        //listen for a submit event from the form that contains the text field in the chat box
        this.chatForm.addEventListener("submit", (e)=> {
            e.preventDefault()
            this.sendTextMessageToServer()
        })
        //listen for a click on the chat icon in the header and return a method that opens the chat box(wrapper) in the footer 
        this.openIcon.addEventListener("click", ()=> this.showChat()) //use arrow function to keep the this keyword pointing towards the Chat object
        //listen for a click on the chat box's close icon and return a method that closes the chat box(wrapper)
        this.closeIcon.addEventListener("click", () => this.hideChat())
    }


    //methods
    
    //create a method that opens the chat box(wrapper) from the footer
    showChat(){
        //The first time a user opens the chat box, create a connection to the server, from the second time onwards, don't create
        if(!this.openedYet){//if it is opened (the first time)
            this.openConnection() //open a connection to the server
        }  
        this.openedYet = true  //set the property to true so that the condition returns false the next times
        this.chatWrapper.classList.add("chat--visible")
        this.chatField.focus() //displays a cursor on the chatfield as soon as the chat wrapper pops up
    }

    //create a method that opens a connection to the server for real time two-way communication
    openConnection(){
        this.socket = io() //creates a connection between the browser and the server
        //store the user's username and avatar in memory when a connection is created 
        this.socket.on("welcome", data => {
            this.username = data.username
            this.avatar = data.avatar
        })
        this.socket.on('chatMessageFromBrowser', (data) => {
            
            this.displayMessageFromServer(data)
        })
    }

    //create a method a displays the chat message from the server
    //sanitize the text message from the frontend using DOMPurify for the users recieving this message
    displayMessageFromServer(textData){
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-other">
        <a href="/profile/${textData.username}"><img class="avatar-tiny" src="${textData.avatar}"></a>
        <div class="chat-message"><div class="chat-message-inner">
          <a href="/profile/${textData.username}"><strong>${textData.username}:</strong></a>
          ${textData.message}
        </div></div>
      </div>
        `))
        this.chatLog.scrollTop = this.chatLog.scrollHeight //set the chat log div to automically scroll down to the latest message
    }

    //create a method that closes the chat box(wrapper)
    hideChat(){
        this.chatWrapper.classList.remove("chat--visible")
    }

    //create a method that sends the user's chat text to the server via the socket connection
    sendTextMessageToServer(){
        this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value}) //chatMessageFromBrowser is the event name that is passed to the server via socket.io
        //add specific html for how the user's message should look from his/her browser
        //sanitize the user's message before its sent (in case the user's account is hacked)
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-self">
        <div class="chat-message">
          <div class="chat-message-inner">
            ${this.chatField.value}
          </div>
        </div>
        <img class="chat-avatar avatar-tiny" src="${this.avatar}">
      </div>
        `))
        this.chatLog.scrollTop = this.chatLog.scrollHeight //set the chat log div to automically scroll down to the latest message
        this.chatField.value = '' //once the text has been sent to the server, clear out the chat text field
        this.chatField.focus() //after clearing out the text, focus puts the cursor back on the chatField
    }

    

    //create a method that contains the html of the chat box
    injectHTML(){
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
        <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }
}