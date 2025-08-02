
const EventType = {
    THRESHOLD_ACHIEVED: 'thresholdAchieved',
    STREAM: 'Stream',
    INVALID: 'Invalid',
    REMOTE_KEY: 'remoteKey',
    SIGN_TXN: 'SignTransaction',
    SIGNED: 'txn_signed',
    PROPOSE_TXN: 'ProposeTransaction',
    EXECUTE_TXN: 'ExecuteTransaction',
}

module.exports = {
    EventType,
}