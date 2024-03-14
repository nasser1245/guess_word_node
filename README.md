
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
  


