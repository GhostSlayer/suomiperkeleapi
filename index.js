require('dotenv').config()
const express = require('express')
const app = express()
const port = 3000

const mysql = require('@drivet/database');
const client = new mysql();

client.connect({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USERNAME,
  password : process.env.MYSQL_PASSWORD,
  database : process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT
})


app.get('/api/steam/csgo', async (req, res) => {
  const tunnit = await client.rowsQuery('SELECT datetime, hours FROM csgo ORDER BY hours DESC')

  console.log(tunnit)
  res.send(tunnit[0])
})

app.listen(port, () => {
  console.log(`Listening: ${port}`)
})