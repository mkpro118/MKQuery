# Example Usage
 
### 1. With a CSS Selector
 ```javascript
const element = $('section#my-element') // selects the section element with id 'my-element'
```
### 2. With a HTML element surrounded by angle brackets
 ```javascript
const element = $('<div>') // Creates a new 'div' element
```
### 3. With a MQ instance
 ```javascript
const element = $('div') // $('div') returns a MQ instance of all divs
const copy = $(element)  // creates a copy of the instance in element
```
### 4. With a NodeWrapper instance
 ```javascript
const element = $('div#my-div') // NodeWrapper instance for the div element with id 'my-div'
const copy = $(element)         // creates a copy of the instance in element
```
### 5. With a function, but without the 'on' option
 ```javascript
// Adds an event listener for the 'load' event on the window
$(function (event) {
    // Function code...
})
```
### 6. With a function, and a defined 'on' option
 ```javascript
// Adds an event listener for the 'click' event on the window
$(function (event) {
    // Function code...
}, {on: 'click'})
```
