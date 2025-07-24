const { EventType } = require('../custom-events/constants.js');
const { CustomEvent } = require('../custom-events/setup.js');

function handleSwarmSocketData(buf) {
    console.log('[handleSwarmSocketData] Data size:', buf.length);

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

function setupCustomEventListenersForSwarm(sock) {
    // coming from RPC API
    
    CustomEvent.on(EventType.PROPOSE_TXN, (txn) => {
        console.log('New transaction event received:', txn);
        
        // here we can use autobase db, 
        // instead of manually sending to nodes
        // using the sock obj

        sock.write(JSON.stringify({
            type: EventType.PROPOSE_TXN,
            data: txn
        }));
    });
}

module.exports = {
    handleSwarmSocketData,
    setupCustomEventListenersForSwarm,
}