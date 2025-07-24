const { EventEmitter } = require('events')

const emitter = new EventEmitter()

const CustomEvent = {
    on: (eventName, listener) => {
        emitter.on(eventName, listener)
    },
    emit: (eventName, ...args) => {
        emitter.emit(eventName, ...args)
    }
}

module.exports = {
    CustomEvent,
}