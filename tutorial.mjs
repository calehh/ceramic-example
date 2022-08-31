import {writeFile} from 'node:fs/promises'
import {CeramicClient} from '@ceramicnetwork/http-client'
import {ModelManager} from '@glazed/devtools'
import {DID} from 'dids'
import {Ed25519Provider} from 'key-did-provider-ed25519'
import {getResolver} from 'key-did-resolver'
import {fromString} from 'uint8arrays'
import restify from 'restify';
import pkg from 'web3-utils';
import {DIDDataStore} from "@glazed/did-datastore";
import modelAliases from './modelTmp.json';
import {DataModel} from '@glazed/datamodel';
import {DIDSession} from "did-session";
import {TileDocument} from '@ceramicnetwork/stream-tile'
import {EthereumAuthProvider, SelfID} from '@self.id/web'

// The key must be provided as an environment variable
const seed = pkg.keccak256("this is ninox").slice(2)
console.log("seed:", seed)
const key = fromString(seed, 'hex')

// Create and authenticate the DID
const did = new DID({
    provider: new Ed25519Provider(key),
    resolver: getResolver(),
})

await did.authenticate()
console.log("did is:", did.id)
// Connect to the local Ceramic node
const ceramic = new CeramicClient('http://localhost:7007')
ceramic.did = did

// Create a manager for the model
const manager = new ModelManager({ceramic})

const noteSchemaID = await manager.createSchema('SimpleNote', {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'SimpleNote',
    type: 'object',
    properties: {
        text: {
            type: 'string',
            title: 'text',
            maxLength: 4000,
        },
    },
})

console.log("note schema id", noteSchemaID)

//load and store data from model.json


await manager.createDefinition('myNote', {
    name: 'My note',
    description: 'A simple text note',
    schema: manager.getSchemaURL(noteSchemaID),
})

await manager.createTile('exampleNote',
    {text: 'A simple note'},
    {schema: manager.getSchemaURL(noteSchemaID)},
)

// Deploy model to Ceramic node
const modelAlias = await manager.deploy()

// Write deployed model aliases to JSON file
await writeFile('./model.json', JSON.stringify(modelAlias))

const aliases = {
    "definitions": {"notes1": "kjzl6cwe1jw147aa287o28wvfe02c8v8g74hf1qip18orcww7qfe0xzupr7z4kc"},
    "schemas": {
        "Not": "ceramic://k3y52l7qbv1fry83hbwcn86fv22hahtsyr2asd1kd5uavpjf99qio00xrmawc4g00",
        "Notes2": "ceramic://k3y52l7qbv1fryqna5rl10ixz93ax3kyirubn0i0b6sqphjpo3uvz9zeqpobxdnuo"
    },
    "tiles": {"placeholderNote": "kjzl6cwe1jw14b9lk9cc8w0xhpu9ywc28rwp2kqtce2kp2y7ek5ozrxzaxkclgm"}
}
const model = new DataModel({ceramic, aliases: aliases})
const store = new DIDDataStore({ceramic, model})

// await store.set('notes', {text: 'This is my note mm'})
const text = "something nice happen";
const title = "niceday";
const doc = await model.createTile('Not', {date: new Date().toISOString(), text});

const notesList = await store.get("notes1")
const notes = notesList?.notes ?? []
// await store.set('notes', {
//     notes: [...notes, {id: doc.id.toUrl(), title}],
// })

const data = await store.get("notes1")
console.log("data", data)

const index = await store.getIndex()
console.log("index", index)

const defination = await store.getDefinition("kjzl6cwe1jw147aa287o28wvfe02c8v8g74hf1qip18orcww7qfe0xzupr7z4kc")
console.log("defination", defination)

const newtext = "dodoyoohaisdgh";
const dd = await TileDocument.load(ceramic, "kjzl6cwe1jw14amz3z2s1u4mhqq3o4awmv74xtqa3bmn4o5etgp877ivbosqu0e")
console.log("content", dd.content)
await dd.update({date: new Date().toISOString(), text: newtext})
console.log("content", dd.content)



// restful service
async function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

function defaultResponse(req, res, next) {
    // console.log(req.header);
    return next();
}

var server = restify.createServer(

);

server.pre(defaultResponse)

server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.listen(8081, function () {
    console.log('%s listening at %s', server.name, server.url);
});


