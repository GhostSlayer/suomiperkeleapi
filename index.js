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
    console.log('failed to fetch steam data')
  }
}

scheduleJob('0 10 * * *', () => {
  dataFetcher()
})

app.use(cors())

app.get('/api/steam/csgo', async (req, res) => {
  const tunnit = await client.rowsQuery('SELECT datetime, hours FROM csgo ORDER BY hours DESC')

  console.log(tunnit)
  res.send(tunnit[0])
})

app.listen(port, () => {
  console.log(`Listening: ${port}`)
})