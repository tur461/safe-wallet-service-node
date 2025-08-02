const { EventEmitter } = require('events')
const {EventType} = require('./constants.js');

const emitter = new EventEmitter()

const CustomEvent = {
    on: (eventName, listener) => {
        emitter.on(eventName, listener)
    },
    off: (eventName, listener) => {
        emitter.off(eventName, listener)
    },
    emit: (eventName, ...args) => {
        emitter.emit(eventName, ...args)
    }
}


function mapKeyToEventType(key) {
    if(key.toLowerCase().indexOf('propose') > -1)
        return EventType.PROPOSE_TXN
    if(key.toLowerCase().indexOf('sign') > -1)
        return EventType.SIGN_TXN
    
    if(key.toLowerCase().indexOf('execute') > -1)
        return EventType.EXECUTE_TXN
    return EventType.INVALID;
}

module.exports = {
    CustomEvent,
    mapKeyToEventType
}