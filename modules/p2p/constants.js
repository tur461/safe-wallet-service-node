const DATA_TYPE = {
    SIGNATURE: 'signature',
    PROPOSED_TXN: 'proposed_txn',

}

const STORE_EVENT_TYPE = {
    DOWNLOAD: 'download',
    DATA: 'data',
    FEED: 'feed',
    CONNECT: 'peer-add',
}

const RPC_POINTS = {
    ECHO: 'echo',
    SIGN_STATUS: 'sign_status',
    PROPOSE: 'propose',
    SIGS_RETRIEVE: 'sigs_retrieve',
}

module.exports = {
    DATA_TYPE,
    RPC_POINTS,
    STORE_EVENT_TYPE,
}