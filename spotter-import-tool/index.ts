import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

import * as dotenv from 'dotenv'

import { leads } from './_data/leads_inep'

const appendFile = util.promisify(fs.appendFile);

dotenv.config()

const SPOTTER_API_KEY = process.env.SPOTTER_API_KEY ?? ''
const SPOTTER_ADMIN = process.env.SPOTTER_ADMIN ?? ''

const SPOTTER_API_ENDPOINT = 'https://api.exactspotter.com/v3/'
const SPOTTER_API_ENDPOINT_UPDATE_LEAD = `${SPOTTER_API_ENDPOINT}/LeadsUpdate`

async function makeRequest(leadObj) {
    const options = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'token_exact': SPOTTER_API_KEY
        },
        body: JSON.stringify({
            lead: {
                customFields: [{
                    id: '_inep',
                    value: leadObj.inep
                }]
            }
        })
    }

    const response = await fetch(`${SPOTTER_API_ENDPOINT_UPDATE_LEAD}/${leadObj.id}`, options)
    const data = await response.json()

    if (!data.value) {
        throw new Error(JSON.stringify(data))
    }

    return {
        ...leadObj
    }
}

async function processLeads(leads) {
    for (let i = 0; i < leads.length; i++) {
        const leadObj = leads[i];
        try {
            const newObj = await makeRequest(leadObj);

            await appendFile(path.join(__dirname, 'success.log.json'), JSON.stringify(newObj) + '\n');
            console.log(newObj)
        } catch (error) {
            await appendFile(path.join(__dirname, 'error.log.json'), JSON.stringify(leads[i]) + '\n');
            console.error(`Error processing lead ${leadObj.id}: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1600));
    }
}

processLeads(leads).catch(console.error);