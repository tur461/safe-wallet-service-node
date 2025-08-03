const fs = require('fs');
const path = require('path');
const {MAX_SEQ_NUM_FILENAME} = require('./constants.js');

function fileExistsSync(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (e) {
        return false;
    }
}

function getPersistedMaxSeqNum(dirPath) {
    const filePath = path.join(dirPath, MAX_SEQ_NUM_FILENAME);

    if (!(fileExistsSync(filePath))) {
        persistMaxSeqNum(dirPath, 0);
        return 0;
    }
    
    const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return parseInt(contents.max_sequence_number, 10);

}
function persistMaxSeqNum(dirPath, seqNum) {
    const filePath = path.join(dirPath, MAX_SEQ_NUM_FILENAME);
    const contents = { max_sequence_number: seqNum };
    fs.writeFileSync(filePath, JSON.stringify(contents));
}

module.exports = {
    persistMaxSeqNum,
    getPersistedMaxSeqNum,
}