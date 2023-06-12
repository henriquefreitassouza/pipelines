import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

import * as dotenv from 'dotenv'
//import { leads } from './_data/leads'
import { leads } from './_data/leads_errors'

const appendFile = util.promisify(fs.appendFile);

dotenv.config()

const SPOTTER_API_KEY = process.env.SPOTTER_API_KEY ?? ''
const SPOTTER_ADMIN = process.env.SPOTTER_ADMIN ?? ''

const SPOTTER_API_ENDPOINT = 'https://api.exactspotter.com/v3/'
const SPOTTER_API_ENDPOINT_INSERT_ORGANIZATION = `${SPOTTER_API_ENDPOINT}organizationAdd`
const SPOTTER_API_ENDPOINT_UPDATE_LEAD = `${SPOTTER_API_ENDPOINT}/LeadsUpdate`

async function makeRequest(leadObj) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token_exact': SPOTTER_API_KEY
        },
        body: JSON.stringify({
            duplicityValidation: false,
            organization: {
                name: leadObj.lead,
                userEmail: SPOTTER_ADMIN
            }
        })
    }

    let response = await fetch(SPOTTER_API_ENDPOINT_INSERT_ORGANIZATION, options)
    let data = await response.json()

    if (!data.value) {
        throw new Error(JSON.stringify(data));
    }

    const organizationId = data.value

    options.method = 'PUT'
    options.body = JSON.stringify({
        lead: {
            organizationId: data.value
        }
    })

    response = await fetch(`${SPOTTER_API_ENDPOINT_UPDATE_LEAD}/${leadObj.id}`, options)
    data = await response.json()

    if (!data.value) {
        throw new Error(JSON.stringify(data))
    }

    return {
        ...leadObj,
        organizationId
    }
}

async function processLeads(leads) {
    for (let i = 0; i < leads.length; i++) {
        const leadObj = leads[i];
        try {
            const newObj = await makeRequest(leadObj);

            await appendFile(path.join(__dirname, 'log.json'), JSON.stringify(newObj) + '\n');
            console.log(newObj)
        } catch (error) {
            await appendFile(path.join(__dirname, 'error.json'), JSON.stringify(leads[i]) + '\n');
            console.error(`Error processing lead ${leadObj.id}: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

processLeads(leads).catch(console.error);