require('dotenv').config()
const fastify = require('fastify')({ logger: true })
const port = process.env.PORT || 3000
const { scheduleJob } = require('node-schedule');
const cors = require('@fastify/cors');

const mysql = require('@drivet/database');
const client = new mysql();

client.connect({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USERNAME,
  password : process.env.MYSQL_PASSWORD,
  database : process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT
})

async function fetchCSGOData() {
  try {
    const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_KEY}&steamid=${process.env.STEAM_ID}`)

    const data = await response.json()
    const csgoData = data.response.games.find((data) => data.appid === 730)

    const hours = Math.floor(csgoData.playtime_forever / 60);
    await client.rowQuery('INSERT INTO csgo (datetime, hours) VALUES (?, ?)', [new Date(), hours])
  } catch (err) {
    console.log('Failed to run dataFetcher function', err)
  }
}

scheduleJob('0 10 * * *', () => {
  fetchCSGOData()
})


fastify.get('/api/steam/csgo', async (req, reply) => {
  if (req.method !== 'GET') return reply.status(405).send({ error: true, status: 405, message: 'The requested method is not allowed'})
  
  try {
    const tunnit = await client.rowsQuery('SELECT datetime, hours FROM csgo ORDER BY hours DESC')

    if (!tunnit.length) {
      fastify.log.warn('no data in database')
      return { hours: 0, datetime: new Date(null) }
    }

    return { hours: tunnit[0]?.hours ?? 0, datetime: tunnit[0]?.datetime ?? new Date(null) }
  } catch (err) {
    throw new Error(err)

  }
})

const start = async () => {
  try {
    await fastify.register(cors)

    await fastify.listen({ port })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()