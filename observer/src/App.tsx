import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios, { AxiosResponse } from "axios";

export interface Message {
  from: string;
  text: string;
  userType: string;
}
export interface Conversation {
  [time: string]: Message;
}

export interface Game {
  inviterId: number;
  guesserId: number;
  word: string;
  conversation: Conversation;
  status: string;
}

export interface GameList {
  [gameId: string]: Game;
}

function App() {
  const [gamesData, setGamesData] = useState<GameList>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: AxiosResponse<GameList> = await axios.get("http://localhost:5000/");
        console.log(response?.data);
        setGamesData(response?.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    // Initial fetch
    fetchData();

    // Fetch data every 5 seconds
    const intervalId = setInterval(fetchData, 5000);

    // Clean up function to clear interval
    return () => clearInterval(intervalId);
  }, []); // empty dependency array ensures useEffect only runs on mount and unmount

  return (
    <div className="App">
      <center>
        <h1>Games list, conversations and states</h1>
        {Object.keys(gamesData).map((game) => (
          <div
            style={{
              width: "80%",
              padding: "10px 0",
              margin: "20px 0",
              border: "2px solid chocolate",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                placeContent: "space-around",
              }}
            >
              <div>Game ID: {game}</div>
              <div>Status: {gamesData[game].status}</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                placeContent: "space-around",
                padding: "10px 0",
              }}
            >
              <div>Inviter ID: {gamesData[game].inviterId}</div>
              <div>Guesser ID: {gamesData[game].guesserId}</div>
              <div>Guess word: {gamesData[game].word}</div>
            </div>
            <hr style={{ margin: "0 30px" }} />
            <div>
              <p style={{fontWeight:700, textAlign:'left', paddingLeft:"20px"}}>Conversations</p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "start",
                  padding: "0px 30px",
                }}
              >
                {Object.keys(gamesData[game].conversation).map((message: string) => {
                  let dt: Date = new Date(parseInt(message));
                  return (
                    <div style={{ display: "flex", flexDirection: "row", margin:"5px 0" }}>
                      <div style={{ color: gamesData[game].conversation[message].userType == "Guesser" ? "darkcyan" : "darkviolet", flexBasis: '70px' }}>
                        {gamesData[game].conversation[message].userType}
                      </div>
                      <div style={{ flexBasis: "10%", fontSize:'10pt' }}>
                        {`(${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}:${dt
                          .getSeconds()
                          .toString()
                          .padStart(2, "0")}):`}
                      </div>
                      <div >
                        {gamesData[game].conversation[message].text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </center>
    </div>
  );
}

export default App;
