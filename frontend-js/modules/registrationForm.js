import axios from "axios"

/*
 Author: CMK
 Date: September 2021

*/
export default class RegistrationForm{

    constructor(){
        this.form = document.querySelector("#registration-form") //this property holds the form action html of the register section of the webpage
        this.allFields = document.querySelectorAll("#registration-form .form-control") //This constructor property holds an array(querySelectorAll) of all three form-control classes(username, email, password) under the form tag with the id of registration-form in the home-guest file
        this.insertValidationElements() //this property calls the method that will display the live validation error messages 
        this.username = document.querySelector("#username-register") //this property holds the username html textfield
        this.username.previousValue = "" //this property keeps record of the original value in the username textfield which is blank
        this.email = document.querySelector("#email-register") //this property holds the email html textfield
        this.email.previousValue = "" //this property keeps record of the original value in the email textfield which is blank
        this.password = document.querySelector("#password-register") //this property holds the password html textfield
        this.password.previousValue = "" //this property keeps record of the original value in the password textfield which is blank
        this.username.isUnique = false
        this.email.isUnique = false
        this._csrf = document.querySelector('[name="_csrf"]').value //this property stores the csrf token value from the hidden input element within the home-guest template
        this.events() //this property calls the eventListeners
    }


    //Events
    events(){
        //listen for each keystroke in the username textfield
        this.username.addEventListener('keyup', () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
        //listen for each keystroke in the email textfield
        this.email.addEventListener('keyup', () => {
            this.isDifferent(this.email, this.emailHandler)
        })
        //listen for each keystroke in the password textfield
        this.password.addEventListener('keyup', () => {
            this.isDifferent(this.password, this.passwordHandler)
        })
        //listen for when the user tries to escape validation error messages by pressing "." and "Tab"
        this.username.addEventListener('blur', () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
        //listen for when the user tries to escape validation error messages by pressing "." and "Tab"
        this.email.addEventListener('blur', () => {
            this.isDifferent(this.email, this.emailHandler)
        })
        //listen for when the user tries to escape validation error messages by pressing "." and "Tab"
        this.password.addEventListener('blur', () => {
            this.isDifferent(this.password, this.passwordHandler)
        })

        //listen for the form being submitted
        this.form.addEventListener("submit", e => {
            e.preventDefault()
            this.formSubmitHandler()
        })
    }


    //Methods
    //create a method that will display the live validation error messages for each textfield
    insertValidationElements(){
        this.allFields.forEach(function(element){
            element.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage "></div>')
        })
    }

    //create a reusable method that checks if a value of a textfield has changed
    isDifferent(el, handler){ //el is short element
        if(el.previousValue != el.value){ //if the textfield is not blank anymore
            handler.call(this) //call the method that evaluates the text in the username texfield for potential validation errors
        }
        el.previousValue = el.value
    }

    //create a method that evaluates the text in the username texfield for potential validation errors
    usernameHandler(){
        this.username.errors = false
        //call a method that immediately responds to validation errors
        this.usernameImmediately()
        //clear the timer after the previous method has executed and the user has fixed their immediate error
        clearTimeout(this.username.timer)
        //set a new timer to wait for the user to finish before calling the method that points out any additional errors
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800)
    }

    //create a method that evaluates the text in the email texfield for potential validation errors
    emailHandler(){
        this.email.errors = false
        //clear the timer after the previous method has executed and the user has fixed their immediate error
        clearTimeout(this.email.timer)
        //set a new timer to wait for the user to finish before calling the method that points out any additional errors
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 800)
    }

    //create a method that evaluates the text in the password texfield for potential validation errors
    passwordHandler(){
        this.password.errors = false
        //call a method that immediately responds to validation errors
        this.passwordImmediately()
        //clear the timer after the previous method has executed and the user has fixed their immediate error
        clearTimeout(this.password.timer)
        //set a new timer to wait for the user to finish before calling the method that points out any additional errors
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800)
    }

    //create a method that evaluates all fields in the registration form for potential errors before submitting
    formSubmitHandler(){
        this.usernameImmediately()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordAfterDelay()
        this.passwordImmediately()

        if(this.username.isUnique &&
           !this.username.errors &&
           this.email.isUnique && 
           !this.email.errors &&
           !this.password.errors){
           this.form.submit()
        }
    }

    //create a method that immediately responds to validation errors for the username
    usernameImmediately(){
        //Alphanumeric errors
        if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
            this.showValidationError(this.username, "Username can only contain letters and numbers")
        }

        //Exceeding Length errors
        if(this.username.value.length > 30){
            this.showValidationError(this.username, "Username can not exceed 30 characters")
        }

        //hide the alert message once the user has deleted their error from the textfield
        if(!this.username.errors){
            this.hideValidationError(this.username)
        }
    }

    //create a method that immediately responds to validation errors for the password
    passwordImmediately(){

        //Exceeding Length errors
        if(this.password.value.length > 50){
            this.showValidationError(this.password, "Password can not exceed 50 characters")
        }

        //hide the alert message once the user has deleted their error from the textfield
        if(!this.password.errors){
            this.hideValidationError(this.password)
        }
    }

    //create a method that responds to errors a little while after the user is done typing the username
    usernameAfterDelay(){
        if(this.username.value.length < 3){
            this.showValidationError(this.username, "Username must be at least 3 characters")
        }

        //if there are no errors, send an asynchronous request to the server with the user's inputed values
        if(!this.username.errors){
            axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.username.value}).then((response)=>{
                if(response.data){ //if that username if found in the database
                    this.showValidationError(this.username, "Username already exists")
                    this.username.isUnique = false
                }else{
                    this.username.isUnique = true
                }
            }).catch(()=>{
                console.log("Please try again later")
            })
        }
    }


    //create a method that responds to errors a little while after the user is done typing the email address
    emailAfterDelay(){
        if(!/^\S+@\S+$/.test(this.email.value)){ //regular expression that checks for valid emails
            this.showValidationError(this.email, "You must provide a valid email address")
        }

        if(!this.email.errors){
            axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.email.value}).then((response)=>{
                if(response.data){
                    this.email.isUnique = false
                    this.showValidationError(this.email, "Email already exists")
                }else{
                    this.email.isUnique = true
                    this.hideValidationError(this.email)
                }
            }).catch(()=>{
                console.log("Please try again later")
            })
        }
    }

    //create a method that responds a little while after the user is done typing the password
    passwordAfterDelay(){
        if(this.password.value.length < 12){
            this.showValidationError(this.password, "Password must be at least 12 characters")
        }

    }

    //create a method that shows the error alert message
    showValidationError(element, message){
        element.nextElementSibling.innerHTML = message //for the username element, the nextElementSibling is the 
        element.nextElementSibling.classList.add("liveValidateMessage--visible")
        element.errors = true
    }

    //create a method that hides the error alert message once the user deletes their error
    hideValidationError(element){
        element.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }
}