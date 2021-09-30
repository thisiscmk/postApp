import Search from './modules/search'
import Chat from './modules/chat'
import RegistrationForm from './modules/registrationForm'

//only leverage the registrationForm code if the current page on the browser has the html id of registration-form
if (document.querySelector("#registration-form")){
    new RegistrationForm()
}
//only leverage the chat feature if the user is logged in
if(document.querySelector("#chat-wrapper")){
    new Chat()
}
//Only open the search overlay if the user is logged in  
if(document.querySelector(".header-search-icon")){new Search()}