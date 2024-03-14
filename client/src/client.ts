import { createConnection } from "net";
import { GWP, PLAYER_STATES } from "./declarations";
import { getUint8Numbers, inviteToMatch, readInput, selectOption, sendSerializedPacket } from "./utlis";

const options: any = process.argv[process.argv.length - 1] == "unix" ? "/tmp/unix_socket_guess_game.sock" : { port: 6226 };
export const connection = createConnection(options).on("error", () => {
  console.error("Could not connect to remote server - Exiting");
});
console.log(process.argv[process.argv.length - 1] == "unix" ? 'Connect via Unix socket to the server': 'Connected via TCP socket to the server')
let userId: Buffer | null = null;
let randomSessionId: Buffer | null = null;
connection.on("data", async (data: Uint8Array) => {
  let responseCode: number = data[0];
  switch (responseCode) {
    case GWP.SERVER_PASSWORD_REQUEST:
    case GWP.INCORRECT_PASSWORD:
      let password: string = await readInput(responseCode === GWP.SERVER_PASSWORD_REQUEST ? `Enter Password: ` : `Incorrect Password, Enter again: `, true);
      const bytePassword: Uint8Array = new TextEncoder().encode(password);
      sendSerializedPacket(data, GWP.AUTH_REQ, bytePassword);
      break;
    case GWP.GEN_USER_ID:
      userId = Buffer.from(data.slice(1, 5));
      randomSessionId = Buffer.from(data.slice(5, 9));
      await selectOption(
        "Welcome. You are not in any match. Please select one of this options:\n  [l] Get list of all waiting players and select one\n  [w] Wait for invite a player\n  [q] Quit\n\nMy choise: ",
        ["l", "w", "q"]
      ).then((choise: string) => {
        switch (choise) {
          case "q":
            sendSerializedPacket(data, GWP.USER_EXIT).then(() => {
              console.log("Have a nice day!");
              process.exit();
            });
            break;
          case "l":
            sendSerializedPacket(data, GWP.CHOOSE_STATE, new Uint8Array(1).fill(PLAYER_STATES.INVITING));
            break;
          case "w":
            sendSerializedPacket(data, GWP.CHOOSE_STATE, new Uint8Array(1).fill(PLAYER_STATES.WAITING));
            break;
        }
      });
      break;
    case GWP.ADDED_TO_WAITLIST:
      console.log("\nYou are in waitlist, please wait until somebody invites you to play a game");
      break;

    case GWP.ADDED_TO_INVITE_LIST:
      await inviteToMatch(data);
      break;

    case GWP.OFFER_MATCH:
      let bytes = data.slice(9, 13);
      const word: Uint8Array = data.slice(13);
      let opponentUserId: number = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
      await selectOption(`\nUser with ID #${opponentUserId} challenged you. Are you accept the match [y/n]? `, ["y", "n"]).then(async (response: string) => {
        if (response == "y") {
          sendSerializedPacket(data, GWP.ACCEPT_MATCH, getUint8Numbers(opponentUserId)).then(async () => {
            console.log(
              '\nThe match begins. Please write questions and guesses. Your rival helps you to find the word. In each step you could type "giveup" to giveup and finish the match. Once you correctly guess the word you will win.'
            );
            while (true) {
              await selectOption("Your question/guess :> ").then(async (quesGuess: string) => {
                if (quesGuess.length > 0) {
                  const byteGuess: Uint8Array = new TextEncoder().encode(quesGuess);
                  if (quesGuess.toLocaleLowerCase() === "giveup") {
                    await sendSerializedPacket(data, GWP.NEW_GUESS, new Uint8Array([...getUint8Numbers(opponentUserId), ...byteGuess])).then(async () => {
                      console.log(`\nHumm! You lost. The word was ${word.toString().toLowerCase().trim()}`);
                      process.exit();
                    });
                  } else if (quesGuess.toLocaleLowerCase().trim() === word.toString().toLocaleLowerCase().trim()) {
                    await sendSerializedPacket(data, GWP.NEW_GUESS, new Uint8Array([...getUint8Numbers(opponentUserId), ...byteGuess])).then(async () => {
                      console.log("\nHooray, You win.");
                      process.exit();
                    });
                  } else {
                    sendSerializedPacket(data, GWP.NEW_GUESS, new Uint8Array([...getUint8Numbers(opponentUserId), ...byteGuess])).then(async () => {});
                  }
                }
              });
            }
          });
        } else {
          await sendSerializedPacket(data, GWP.REJECT_MATCH, getUint8Numbers(opponentUserId));
        }
      });
      break;

    case GWP.USER_ACCEPTED_MATCH:
      console.log("\nUser Accepted the match and it begins. Please write hints to help your rival.");
      let wbytes = data.slice(9, 13);
      let guesserId = (wbytes[0] << 24) | (wbytes[1] << 16) | (wbytes[2] << 8) | wbytes[3];
      while (true) {
        await selectOption("Your hint:> ").then(async (hint: string) => {
          if (hint.length > 0) {
            const byteGuess: Uint8Array = new TextEncoder().encode(hint);
            await sendSerializedPacket(data, GWP.NEW_HINT, new Uint8Array([...getUint8Numbers(guesserId), ...byteGuess]));
          }
        });
      }
      break;

    case GWP.USER_REJECTED_MATCH:
      console.log("\nUnfortunately the user rejectes your challenge. Please select another user.");
      await inviteToMatch(data);
      break;

    case GWP.NEW_MESSAGE:
      const guessHint: string = data.slice(13).toString();
      process.stdout.write(`\nRival message:> ${guessHint}\n`);
      break;

    case GWP.USER_WINS:
      console.log("\nHumm! Your rival correctly guessed the word and therefore you lost!");
      process.exit();
      break;

    case GWP.USER_GIVEUP:
      console.log("\nCongrats, your rival gives up, you won.");
      process.exit();
      break;
    case GWP.SERVER_ERROR:
      console.log("\nServer Error");
      process.exit();
      break;
    case GWP.UNAUTHORIZED:
      console.log("\nAuthentication Error");
      process.exit();
      break;
  }
});
