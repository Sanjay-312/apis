const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`server running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDb();

const convertPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerObjectToResponseObject(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `UPDATE player_details 
                        SET player_name="${playerName}";`;
  await db.run(updateQuery);
  response.send(`Player Details Updated`);
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;

  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchObjectToResponseObject(matchDetails));
});

//API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details
                                WHERE player_id=${playerId};`;
  const playerMatches = await db.all(getAllMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchObjectToResponseObject(eachMatch)
    )
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
  SELECT *
  FROM 
  player_match_score NATURAL JOIN player_details
 WHERE match_id=${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playersQuery = `SELECT
   player_id AS playerId,
   player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM 
     player_match_score NATURAL JOIN player_details
    WHERE
     player_id=${playerId};`;
  const scoreDetailsArray = await db.get(playersQuery);
  response.send(scoreDetailsArray);
});

module.exports = app;
