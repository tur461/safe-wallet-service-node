const net = require('net');
const { IPC } = require('./constants');

class IpcEnclaveClient {
    constructor(socketPath) {
        this.socketPath = socketPath;
    }

    enclaveSignData(hexData) {
        return this.send(IPC.CMD.SIGN, IPC.TYPE.SECP256K1, hexData)
    }

    send(command, type, hexData) {
        return new Promise((resolve, reject) => {
            const client = net.createConnection(this.socketPath, () => {
                const msg = `${command} ${type} ${hexData}`;
                client.write(msg);
            });

            let response = '';

            client.on('data', (data) => {
                response += data.toString();
            });

            client.on('end', () => {
                resolve(response);
            });

            client.on('error', (err) => {
                reject(err);
            });
        });
    }
}

module.exports = IpcEnclaveClient;
