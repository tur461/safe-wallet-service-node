const Corestore = require('corestore')
const Hyperbee = require('hyperbee')

async function setupStoreAndDB(coreStorePath, opts={}) {
    // coreStorePath = getNextAvailableNodePath(coreStorePath);
    
    const store = new Corestore(coreStorePath)
    await store.ready()

    const core = store.get({ name: 'db' })
    await core.ready()

    const db = new Hyperbee(core, {
        keyEncoding: 'utf-8',
        valueEncoding: 'json'
    });
    

    return {
        db,
        store,
    }
}



module.exports = setupStoreAndDB;