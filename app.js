const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite = require('sqlite3')
const path = require('path')
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null
//initializing the database
const initializeDB = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite.Database,
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
  app.listen(3000, () => {
    console.log('Server started')
  })
}
initializeDB()
const converPlayerDbobjectToObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
const converMatchDbObjectToObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
module.exports = app
//API 1
app.get('/players/', async (request, response) => {
  let getPlayers = `SELECT * FROM player_details`
  let players = await db.all(getPlayers)
  console.log(players)
  let reslut = players.map(each => converPlayerDbobjectToObject(each))
  response.send(reslut)
})
// API 2
app.get('/players/:playerId', async (request, response) => {
  let {playerId} = request.params
  console.log(playerId)
  let playerDetails = await db.get(
    `SELECT * FROM player_details WHERE player_id=${playerId}`,
  )
  response.send(converPlayerDbobjectToObject(playerDetails))
})
//API 3
app.put('/players/:playerId', async (request, response) => {
  let {playerId} = request.params
  const playerDetails = request.body
  console.log(playerDetails)
  const {playerName} = playerDetails
  console.log(playerName, playerId)
  await db.run(
    `UPDATE player_details SET player_id=${playerId},player_name='${playerName}' WHERE player_id=${playerId}`,
  )
  response.send('Player Details Updated')
})
//API 4
app.get('/matches/:matchId/', async (request, response) => {
  let {matchId} = request.params
  let matchDetails = await db.get(
    `SELECT * FROM match_details WHERE match_id=${matchId}`,
  )
  console.log(matchDetails)
  response.send(converMatchDbObjectToObject(matchDetails))
})
//API 5
app.get('/players/:playerId/matches', async (request, response) => {
  let {playerId} = request.params
  let matchDetails = await db.all(
    `SELECT match_details.match_id AS matchId,match_details.match AS match,match_details.year AS year FROM match_details INNER JOIN player_match_score ON player_match_score.match_id=match_details.match_id WHERE player_match_score.player_id=${playerId}`,
  )
  console.log(matchDetails)
  response.send(matchDetails)
})
//API 6
app.get('/matches/:matchId/players', async (request, response) => {
  let {matchId} = request.params
  let playerDetails = await db.all(
    `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName FROM player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE player_match_score.match_id=${matchId}`,
  )
  console.log(playerDetails)
  response.send(playerDetails)
})
//API 7
app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`
  const playersMatchDetails = await db.get(getmatchPlayersQuery)
  response.send(playersMatchDetails)
})
