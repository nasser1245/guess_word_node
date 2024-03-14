import { createServer } from "net";
import { unlinkSync } from "fs";

import { serverLogic } from "./entry";
import { ObserverPort, TCPPort, gameList, unixSocketPath } from "./globals";

// TCP Server
const server = createServer(async (socket) => {
  await serverLogic(socket);
});

server.listen(TCPPort, () => {
  console.log(`TCP server listening on: ${TCPPort}`);
});

try {
  unlinkSync(unixSocketPath);
} catch (err) {
  // Not exist or permission denied.
}

// Unix Socket
const unixServer = createServer(async (socket) => {
  console.log("Unix socket client connected");
  await serverLogic(socket);
});

unixServer.listen(unixSocketPath, () => {
  console.log("Unix socket server listening on", unixSocketPath);
});



// express.js Observer Server
import * as express from "express";
import * as cors from 'cors'

const app = express();
app.use(cors())

app.get("/", (req: any, res: any) => {
  res.send(JSON.stringify(gameList));
});

app.listen(ObserverPort, () => {
  console.log(`Observer listening on port ${ObserverPort}`);
});
