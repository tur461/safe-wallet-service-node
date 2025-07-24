const { EventType } = require('../custom-events/constants.js');
const { CustomEvent, mapKeyToEventType } = require('../custom-events/setup.js');

function handleSwarmSocketData(buf) {
    console.log('[handleSwarmSocketData] Data:', buf);

    try {
        const data = JSON.parse(buf.toString());
        
        switch(data.type) {
            case EventType.PROPOSE_TXN:
                console.log('Transaction proposal received:', data.data);
            break;
            default:
                console.log('Not Implemented!')
        }
    } catch (err) {
        console.error('incoming data could not be parsed as json!')
    }
}

function handleIncomingData(data) {
    const evType = mapKeyToEventType(data.key);
    try {
        switch(evType) {
            case EventType.SIGN_TXN:
                console.log('Transaction sign req received:', data.value);
            break;
            case EventType.EXECUTE_TXN:
                console.log('Transaction exec req received:', data.value);
            break;
            case EventType.PROPOSE_TXN:
                console.log('Transaction proposal received:', data.value);
            break;
            default:
                console.log('Not Implemented!')
        }
    } catch (err) {
        console.error('incoming data could not be parsed as json!')
    }
}

function setupCustomEventListenersForSwarm(sock) {
    // coming from RPC API

    
    
    CustomEvent.on(EventType.PROPOSE_TXN, (txn) => {
        console.log('New transaction event received:', txn);
        handleIncomingData(txn);
    });
    
    CustomEvent.on(EventType.STREAM, (data) => {
        console.log('New stream event received:', data);
        
        handleIncomingData(data);

    });
}

module.exports = {
    handleSwarmSocketData,
    setupCustomEventListenersForSwarm,
}