import {CeramicClient} from '@ceramicnetwork/http-client'
import {DID} from 'dids'
import {Ed25519Provider} from 'key-did-provider-ed25519'
import {getResolver} from 'key-did-resolver'
import {fromString} from 'uint8arrays'
import pkg from 'web3-utils';
import {DIDDataStore} from "@glazed/did-datastore";
import {DataModel} from '@glazed/datamodel';
import {model} from '@datamodels/identity-profile-basic'
import {ModelManager} from "@glazed/devtools";
import {writeFile} from "node:fs/promises";
import {TileDocument} from "@ceramicnetwork/stream-tile";

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

const manager = new ModelManager({ceramic})
manager.addJSONModel(model)
const aliases = await manager.deploy()
await writeFile('./model_basicProfile.json', JSON.stringify(aliases))


const dmodel = new DataModel({ceramic, aliases: aliases})
const store = new DIDDataStore({ceramic, dmodel})

const definitionID = 'kjzl6cwe1jw145cjbeko9kil8g9bxszjhyde21ob8epxuxkaon1izyqsu8wgcic'

const defi = await store.getDefinition('kjzl6cwe1jw145cjbeko9kil8g9bxszjhyde21ob8epxuxkaon1izyqsu8wgcic');
console.log("basic profile defination", defi);

const record = await store.getRecord(definitionID)
console.log("record", record);

const testProfile = {
    name: "ninox",
    description: "genius",
}

const streamID = await store.setRecord(definitionID, testProfile);
console.log("stream id", streamID);

// const streamId = 'k2t6wyfsu4pfwzi8veh43738jwkxcto43sjp3ydm4w2dftd74qktapelu3d48w';
const streamId = await store.getRecordID(definitionID);
console.log('record id', streamId)

const recordNew = await store.getRecord(definitionID);
console.log('record', recordNew);

const doc = await TileDocument.load(ceramic, streamId)
console.log("doc", doc.content);
