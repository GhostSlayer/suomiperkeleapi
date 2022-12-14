require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const { scheduleJob } = require('node-schedule');
const cors = require('cors');

const mysql = require('@drivet/database');
const client = new mysql();

client.connect({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USERNAME,
  password : process.env.MYSQL_PASSWORD,
  database : process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT
})

async function dataFetcher () {
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
  dataFetcher()
})

app.use(cors())

app.get('/api/steam/csgo', async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: true, status: 405, message: 'The requested method is not allowed'})
  
  try {
    const tunnit = await client.rowsQuery('SELECT datetime, hours FROM csgo ORDER BY hours DESC')

    if (!tunnit.length) return res.status(403).json({ hours: 0, datetime: new Date(null) })

    res.send(tunnit[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: true, status: 500, message: 'Failed to fetch data from the database.'})

  }
})

app.listen(port, () => {
  console.log(`Listening: ${port}`)
})