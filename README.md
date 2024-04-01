
# Guess the word raw socket
TCP and Unix socket implementation without using external libraries in typescript node.js. Implemented a chat app in the terminal and react-based games observer.

## Server
  Install and start with:
```bash
  npm install
  npm run start
```
  Port `6226` for clients TCP connection, path `/tmp/unix_socket_guess_game.sock` for the unix socket path file name, and port `5000` for the observer.
  Based on the task description I do not use usernames and set a single password `hi` for the app and userId is also auto incremental, thus the user IDs will remain identical while running the server.

## Client
  ```bash
  npm install
  npm run start       # TCP Socket
  npm run start unix  # Unix Socket
                      # the password is 'hi'
  ```
  the game ends if the guesser user types `giveup` (lose) or correctly guesses the word (Win).

## Observer
  React-based observer for the games.
```bash
  npm install
  npm run start
```
While the server is running start the observer and visit `localhost:3000`. The inviter user is named “Hinter” and the user who guesses is named ‘Guesser’ in the observer list. The result of the game, messages sorted by time, and guess words are also shown.

<details>
  <summary>
<h3>Appendix (Test task) </h3>
  </summary>

  
  Using a language of choice from the following:

- Rust
- Typescript
- Python
- C/C++

Without using external libraries (unless neccessary), write two applications. These applications will be a client and a server app.
They will communicate over a TCP socket and the exact "protocol" on top of that is up to you. 
Note: using just utf8 strings will have a negative impact on the judgement (hint - custom binary protocol is expected).

Upon connection - the server must send a message to the client - initiating the communication.
Client upon receiving it - answers to the server with a password.
This initial exchange then ends with server either disconnecting the client (wrong password) or assigning the client an ID and sending the ID back to the client.

At this moment, the server answers to any requests the client sends to the server. For unknown requests, the server must respond as well, such that client can identify it as an error.

The main function of the server at this moment - is to facilitate game of "Guess a word" between two clients.
The game flow is as follows:

1. Client A requests a list of possible opponents (IDs)
2. Server responds with a list of possible opponents (IDs)
3. Client A requests a match with opponent (ID), specifying a word to guess
4. Server either confirms this or rejects with an error code
5. The target client - client B - is informed of the match, and can begin guesses
6. Client A is informed of the progress of Client B (attempts)
7. Client A can write an arbitrary text (a hint) that is sent to and displayed by Client B
8. Match ends when Client B guesses the word, or gives up

#### Server specifics:
Must offer both Unix socket and a TCP port for client connection.

Optional/bonus: offer a website that displays the progress of all the matches, for a third party to observe.


#### RUNTIME:

Both the client and the server must run on Linux, specifically Ubuntu 22.04, without any containers or virtualization. It will be tested on x86 64bit architecture system.

#### JUDGEMENT:

The following things play role for passing to the interview stage:

- Understanding of both the technologies used and the language chosen.
- Complexity of the chosen solution.
- Efficiency of the custom communication protocol.
- Instructions to run the test task provided -> we will evaluate it on freshly installed Ubuntu 22.04.

</details>

