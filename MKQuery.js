/**
 * @author M K
 *
 * Universal Function for selecting or creating elements
 *
 * If called with a string,
 *     If the string is a CSS Selector, will return,
 *         A NodeWrapper instance, if exactly one element matches the selector
 *         An MQ instance, if more than one element matches the selector
 *     If the string is an HTML element surrounded by angle brackets
 *         A NodeWrapper instance of the newly created element
 *
 * If called with a MQ instance, a copy of the MQ instance is returned
 *
 * If called with a NodeWrapper instance, a copy of the NodeWrapper instance is returned
 *
 * If called with a function,
 *     If key 'on' is defined in the options argument,
 *         Adds an event listener to the global window instance, on the event
 *         specified by the key 'on'
 *     If key 'on' is not defined in the options argument,
 *         Adds an event listener to the global window instance, on the 'load' event
 *
 *     An additional 'useCapture' key may be defined in the options argument
 *
 * Example Usage
 *
 * 1. With a CSS Selector
 *     const element = $('section#my-element') // selects the section element with id 'my-element'
 *
 * 2. With a HTML element surrounded by angle brackets
 *     const element = $('<div>') // Creates a new 'div' element
 *
 * 3. With a MQ instance
 *     const element = $('div') // $('div') returns a MQ instance of all divs
 *     const copy = $(element)  // creates a copy of the instance in element
 *
 * 4. With a NodeWrapper instance
 *     const element = $('div#my-div') // NodeWrapper instance for the div element with id 'my-div'
 *     const copy = $(element)         // creates a copy of the instance in element
 *
 * 5. With a function, but no 'on' option
 *     // Adds an event listener for the 'load' event on the window
 *     $(function (event) {
 *         // Function code...
 *     })
 *
 * 6. With a function, and a defined 'on' option
 *     // Adds an event listener for the 'click' event on the window
 *     $(function (event) {
 *         // Function code...
 *     }, {on: 'click'})
 *
 * @param  {string | MQ | NodeWrapper} args    The element to select or create
 * @param  {Object}                    options Additional options to use
 *
 * @return {MQ | NodeWrapper}
 */
function $(args, options={}) {
    if (typeof args === 'string') {
        options.__str__ = true
    }
    else if (typeof args === 'function') {
        if (!('on' in options)) {
            options.on = 'load'
        }
        if (!('useCapture' in options)) {
            options.useCapture = false
        }
        window.addEventListener(options.on, args, options.useCapture)
    }
    else {
        options.__str__ = false
        if (args.__isProxy) {
            options.__isp__ = true
        }
        else {
            options.__isp__ = false
        }
    }
    return new MQ(args, options)
}

/**
 * @author M K
 *
 * Stores a list of selected elements to perform mass operations on
 */
class MQ {
    #nl
    /**
     * Internal method, shouldn't be called by external sources
     * All functions must be used from the objects returned by the `$` function
     *
     * @param  {string | MQ | NodeWrapper} n Args to the constructor
     * @param  {Object}                    o Additional args
     *
     * @return {MQ | NodeWrapper} The result of the query wrapped in either MQ or NodeWrapper
     */
    constructor (n, o) {
        if (!o.__str__) {
            if (o.__isp__) {
                return new NodeWrapper(n.get())
            }
            return new NodeWrapper(n)
        }
        delete o.__str__
        if (n.startsWith('<') && n.endsWith('>')) {
            return MQ.__create__(n.slice(1,-1), o)
        }
        try {
            this.#nl = [...document.querySelectorAll(n)]
        }
        catch (err) {
            throw new MQInvalidSelectorError("Invalid Selector")
        }
        this.#wrap()
        if (this.#nl.length === 0) {
            this.length = 0
        }
        else {
            this.length = this.#nl.length
        }
        return this.#nl.length == 1 ? this.first() : this
    }

    /**
     * Iterator to allow usage of the instance in `for ... of` loops
     */
    [Symbol.iterator]() {
        let _ = 0
        return {
            next: () => {
                if (_ == this.#nl.length) return {done: true}
                return { done: false, value: this.#nl[_++]}
            }
        }
    }

    /**
     * Internal method to create instances, shouldn't be called by external sources
     * All functionality must be used by the `$` function
     *
     * @param  {string}    n element to create
     * @param  {Object} o additional arguments
     *
     * @return {NodeWrapper} The newly created element
     */
    static __create__(n, o) {
        let _
        try {
            _ =  new NodeWrapper(document.createElement(n))
        }
        catch (err) {
            console.log(err)
            throw new MQElementCreationError(`Cannot create element ${n}`)
        }
        for(let __ of Object.keys(o)) {
            _.get()[__] = o[__]
        }
        return _
    }

    /**
     * Allows manipulation of CSS properties of the given instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * Can be called with 2 signatures
     *
     * 1. With 2 arguments, `instance.css(property, value)`
     *     Applies the given value of the specified property on each element
     * 2. With 3 arguments, `instance.css(property, value, importance)`
     *     Applies the given value and importance of the specified property on each element
     *
     * @param  {string} p The property to read or write to
     * @param  {string} v The value to write to the specified property
     * @param  {string} i (optional) The priority of the value on the specified property
     *
     * @return {MQ} The current calling instance (this)
     */
    css(p, v, i) {
        if (!p || !v) throw new MQIllegalArgumentError("Poperty and Value must be specified")
        return this.each(e => e.css(p, v, i))
    }

    /**
     * Allows manipulation of innerHTML property of the given instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @param  {string} t The value to write to the innerHTML property
     *
     * @return {MQ} The current calling instance (this)
     */
    html(t) {
        if (!t) throw new MQIllegalArgumentError("No arguments specified for NodeWrapper.html(t)")
        return this.each(e => e.html(t))
    }

    /**
     * Allows manipulation of innerText property of the given instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @param  {string} t The value to write to the innerText property
     *
     * @return {MQ} The current calling instance (this)
     */
    text(t) {
        if (!t) throw new MQIllegalArgumentError("No arguments specified for NodeWrapper.text(t)")
        return this.each(e => e.text(t))
    }

    /**
     * Returns the nth element in the list of elements in this instance
     * Index may be negative, which represents elements from the end of the list
     *
     * @param  {number} n The index of the element to retrieve
     *
     * @return {NodeWrapper} The nth element in the list of elements
     */
    nth(n) {
        n = parseInt(n)
        if (isNaN(n)) throw new MQIllegalArgumentError("Illegal Argument")
        n += n < 0 ? this.#nl.length : 0
        if (!(0 < n < this.#nl.length)) throw new MQIndexOutOfBoundsError("Index Out Of Bounds")
        return this.#nl[n]
    }

    /**
     * Applies the given function on each of the selected elements in this instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @param  {function} c The function to apply to each element
     *
     * @return {MQ} The current calling instance (this)
     */
    each(c) {
        if (typeof c !== 'function') throw new MQIllegalArgumentError("Illegal Argument")
        for(let _ of this.#nl) c(_)
        return this
    }

    /**
     * Maps the given function on each of the selected elements in this instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @param  {function} c The function to apply to each element
     *
     * @return {Array} The resulting mapped values
     */
    map(c) {
        if (typeof c !== 'function') throw new MQIllegalArgumentError("Illegal Argument")
        const _results = []
        for(let _ of this.#nl) _results.push(c(_))
        return _results
    }

    /**
     * Returns the first element from the selected elements in this instance
     *
     * @return {NodeWrapper} The first element
     */
    first() {return this.#nl[0]}

    /**
     * Returns the last element from the selected elements in this instance
     *
     * @return {NodeWrapper} The last element
     */
    last() {return this.#nl[this.#nl.length - 1]}

    /**
     * Internal method to wrap HTMLElement with a NodeWrapper
     */
    #wrap() {this.#nl = this.#nl.map(_ => new NodeWrapper(_))}

    /**
     * Returns an Array of NodeWrapper instance corresponding to the selected elements
     *
     * @return {Array} The NodeWrapper instances of the selected elements
     */
    list() {return this.#nl}

    /**
     * Returns the number of selected elements
     *
     * @return {number} The number of selected elements
     */
    length() {return this.#nl.length}

    /**
     * Dispatches a click event on all the selected elements in this instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @return {MQ} The current calling instance (this)
     */
    click() {return this.each(e => e.click())}

    /**
     * Adds an event listener to all the selected elements in this instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @param  {string}   e The event to add the handler to
     * @param  {function} c The handler callback function
     * @param  {boolean}  u useCapture argument for adding eventListener
     *
     * @return {MQ} The current calling instance (this)
     */
    on(e,c,u) {return this.each(q => q.on(e, c, u))}

    /**
     * Appends the selected elements in this instance, to a given parent element
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @param  {HTMLElement | NodeWrapper} n The parent element to add to
     *
     * @return {MQ} The current calling instance (this)
     */
    appendTo(n) {return this.each(e => e.appendTo(n))}

    /**
     * Adds a CSS class to all the selected elements in this instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @param  {string} c variable number of strings, each being a class to add
     *
     * @return {MQ} The current calling instance (this)
     */
    addClass(...c) {return this.each(e => e.addClass(...c))}

    /**
     * Removes a CSS class to all the selected elements in this instance
     * Note: This is a mass operation, applies to all selected elements in this instance
     *
     * @param  {string} c variable number of strings, each being a class to remove
     *
     * @return {MQ} The current calling instance (this)
     */
    removeClass(...c) {return this.each(e => e.removeClass(...c))}
}

/**
 * @author M K
 *
 * Wraps a HTMLElement instance to provide additional functionality
 */
class NodeWrapper {
    /**
     * Internal method, shouldn't be called by external sources
     * All functionality must be used by the `$` function
     *
     * @param  {HTMLElement} n Args to the constructor
     *
     * @return {NodeWrapper} A Wrapped HTMLElement
     */
    constructor(n) {
        this.n = n
        this.length = 1
        this.__isProxy = false
        return NodeWrapper.#proxify(this)
    }

    /**
     * Allows the object to be used in `for ... of` loops
     *
     * Only exists for compatibility with MQ, so users do not have to
     * worry about being unable to use results from `$` as iterators
     */
    [Symbol.iterator]() {
        let _ = false
        return {
            next: () => {
                if (_) return {done: true}
                _ = true
                return { done: false, value: this}
            }
        }
    }

    /**
     * Dispatches a click event on the HTMLElement wrapped by the instance
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    click() {
        this.n.click()
        return this
    }

    /**
     * Allows manipulation of innerHTML property of the wrapped HTMLElement
     *
     * Can be used with 2 signatures
     * 1. Without arguments, `instance.html()`
     *     Returns the value of the innerHTML property
     * 2. With 1 argument, `instance.html(html)`
     *     Sets the innerHTML property to the given argument
     *
     * @param  {string} t (optional) The value to write to the innerHTML property
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    html(t) {
        if (!t) return this.n.innerHTML
        this.n.innerHTML = `${t}`
        return this
    }

    /**
     * Allows manipulation of innerText property of the wrapped HTMLElement
     *
     * Can be used with 2 signatures
     * 1. Without arguments, `instance.text()`
     *     Returns the value of the innerText property
     * 2. With 1 argument, `instance.text(text)`
     *     Sets the innerText property to the given argument
     *
     * @param  {string} t (optional) The value to write to the innerText property
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    text(t) {
        if (!t) return this.n.innerText
        this.n.innerText = `${t}`
        return this
    }

    /**
     * Allows manipulation of value property of the wrapped HTMLElement
     * Usually used with input elements
     *
     * Can be used with 2 signatures
     * 1. Without arguments, `instance.val()`
     *     Returns the value of the value property
     * 2. With 1 argument, `instance.val(val)`
     *     Sets the value property to the given argument
     *
     * @param  {string} t The value to write to the value property
     *
     * @return {NodeWrapper} The current calling instance (this),
     *              null if the property 'value' is not defined in the
     *              wrapped element
     */
    val(t) {
        if (!('value' in this.n)) return null
        if (!t && !(t === '')) return this.n.value
        this.n.value = `${t}`
        return this
    }

    /**
     * Allows manipulation of CSS properties of the wrapped HTMLElement
     *
     * Can be called with 2 signatures
     *
     * 1. With 2 arguments, `instance.css(property, value)`
     *     Applies the given value of the specified property on the wrapped HTMLElement
     * 2. With 3 arguments, `instance.css(property, value, importance)`
     *     Applies the given value and importance of the specified property on the wrapped HTMLElement
     *
     * @param  {string} p The property to read or write to
     * @param  {string} v The value to write to the specified property
     * @param  {string} i (optional) The priority of the value on the specified property
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    css(p, v, i) {
        if (!p) return this.n.style
        if (!v) return getComputedStyle(this.n).getPropertyValue(`${p}`)
        this.n.style.setProperty(`${p}`, `${v}`, i)
        return this
    }

    /**
     * Adds an event listener to the wrapped HTMLElement
     *
     * @param  {string}   e The event to add the handler to
     * @param  {function} c The handler callback function
     * @param  {boolean}  u useCapture argument for adding eventListener
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    on(e, c, u) {
        if (!e || !c) throw new MQEventBindError(`Cannot bind callback ${c} to event ${e}`)
        if (typeof c !== 'function') throw new MQEventBindError(`Cannot bind callback ${c} to event ${e}, because ${c} is not a function`)
        this.n.addEventListener(e, c, u)
        return this
    }

    /**
     * Appends the given args to the wrapped HTMLElement
     *
     * @param  {HTMLElement | NodeWrapper} n The elements to add to the wrapped HTMLElement
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    append(...n) {
        if (!n) return this
        let _n = [...n]
        if (_n[0] instanceof Array) _n = _n[0]
        for(let _ of _n) {
            if (_ instanceof NodeWrapper) {
                this.n.appendChild(_.get())
            } else {
                this.n.appendChild(_)
            }
        }
        return this
    }

    /**
     * Appends the wrapped HTMLElement to a given parent element
     *
     * @param  {HTMLElement | NodeWrapper} n The parent element to add to
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    appendTo(n) {
        let k
        if (typeof n === 'string') k = (new MQ(n, {__str__:true})).get()
        else if (n instanceof NodeWrapper) k = n.get()
        else k = n
        k.appendChild(this.n)
        return this
    }

    /**
     * Returns the HTMLElement wrapped by this instance
     *
     * @return {HTMLElement} the HTMLElement wrapped by this instance
     */
    get() {return this.n}

    /**
     * Adds a CSS class to the wrapped HTMLElement
     *
     * @param  {string} c variable number of strings, each being a class to add
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    addClass(...c) {
        if (!c) throw new MQIllegalArgumentError(`Cannot add class ${c}`)
        for(let _ of c) {
            this.n.classList.add(_)
        }
        return this
    }

    /**
     * Removes a CSS class to the wrapped HTMLElement
     *
     * @param  {string} c variable number of strings, each being a class to remove
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    removeClass(...c) {
        if (!c) throw new MQIllegalArgumentError(`Cannot add class ${c}`)
        for(let _ of c) {
            this.n.classList.remove(_)
        }
        return this
    }

    /**
     * Finds a given HTMLElement in the wrapped HTMLElement
     *
     * @param  {string} n The CSS Selector of the HTMLElement to find
     *
     * @return {NodeWrapper}  The element if found, null otherwise
     */
    find(n) {
        if (typeof n === 'string') {
            const _ = this.n.querySelector(`${n}`)
            if (_) return new NodeWrapper(_)
            return null
        } else {
            throw new MQIllegalArgumentError("Can only find by by CSS Selector")
        }
    }

    /**
     * Checks whether a given HTMLElement in the wrapped HTMLElement
     *
     * @param  {HTMLElement | NodeWrapper} n The HTMLElement to find
     *
     * @return {boolean} `true` if found, `false` otherwise
     */
    contains(n) {
        if (n instanceof NodeWrapper) {
            return this.n.contains(n.get())
        }
        else if (n instanceof HTMLElement) {
            return this.n.contains(n)
        }
        else {
            throw new MQIllegalArgumentError("contains can only find HTMLElement or NodeWrapper objects")
        }
    }

    /**
     * Internal method to wrap instances with a proxy
     *
     * @param  {NodeWrapper} t The instance to wrap
     */
    static #proxify(t) {
        if (t.__isProxy) return t
        t.__isProxy = true
        return new Proxy(t, {
            get: (_t, p, r) => {
                return (p in _t) ? _t[p] : t.n[p]
            },
            set: (_t, p, v, r) => {
                if (p in _t) {
                    _t[p] = v
                }
                else {
                    t.n[p] = v
                }
                return true
            },
        })
    }

    /**
     * Returns a one element Array containing the current calling object
     *
     * Only exists for compatibility with MQ, so users do not have to
     * worry about being unable to call `.list()` on results from `$`
     *
     * @return {Array} a one element Array containing the current calling object
     */
    list() {return [this]}

    /**
     * Allows manipulation of data attributes of the wrapped HTMLElement
     *
     * Can be called with 3 signatures
     *
     * 1. Without arguments, `instance.attr()`
     *     Returns the dataset property of the wrappend HTMLElement
     * 2. With 1 arguments, `instance.css(attr)`
     *     Returns the value of the specified data attribute
     * 3. With 2 arguments, `instance.css(attr, value)`
     *     Sets the value of the specified attribute to the given value
     *     Returns the current calling instance
     *
     * @param  {string} p The property to read or write to
     * @param  {string} v The value to write to the specified property
     * @param  {string} i (optional) The priority of the value on the specified property
     *
     * @return {NodeWrapper | Object} The dataset property of the HTMLElement if called by signature #1
     *                                The value of the data attribute of the HTMLElement if called by signature #2
     *                                The current calling instance (this) if called by signature #3
     */
    attr(a, v) {
        if (!a) return this.n.dataset
        if (!v) return this.n.dataset[`${a}`]
        this.n.dataset[`${a}`] = v
        return this
    }

    /**
     * Applies the given function on the wrapped HTMLElement
     *
     * Only exists for compatibility with MQ, so users do not have to
     * worry about being unable to call `.each()` on results from `$`
     *
     * @param  {function} c The function to apply
     *
     * @return {NodeWrapper} The current calling instance (this)
     */
    each(c) {
        if (typeof c !== 'function') throw new MQIllegalArgumentError("Illegal Argument")
        c(this)
        return this
    }
}

/**
 * @author M K
 *
 * Base Erros class for all MQErrors
 */
class MQError extends Error {
    /**
     * Internal method, shouldn't be called by external sources
     *
     * @param  {string} message The error message
     */
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}

/**
 * @author M K
 *
 * Thrown if invalid CSS selectors are passed as arguments
 */
class MQInvalidSelectorError extends MQError {}

/**
 * @author M K
 *
 * Thrown if invalid arguments are passed to the 'on' methods
 */
class MQEventBindError extends MQError {}

/**
 * @author M K
 *
 * Thrown if invalid arguments as passed
 */
class MQIllegalArgumentError extends MQError {}

/**
 * @author M K
 *
 * Thrown if index accessed is out of bounds
 */
class MQIndexOutOfBoundsError extends MQError {}

/**
 * @author M K
 *
 * Thrown if invalid element creation is not possible with given arguments
 */
class MQElementCreationError extends MQError {}
