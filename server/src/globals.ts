// Global variables

import { GameList, UserList } from "./declarations";

export const TCPPort = 6226;
export const unixSocketPath = "/tmp/unix_socket_guess_game.sock";
export const ObserverPort = 5000;

export let passwd: string = "hi";

export let userIdList: UserList = {};
export let gameList: GameList = {};