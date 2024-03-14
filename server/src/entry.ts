import { Socket } from "net";
import { getUint8Numbers, getWaitedUsersList, sendSerializedPacket } from "./utils";
import { gameList, passwd, userIdList } from "./globals";
import { GWP, Message, PLAYER_STATES } from "./declarations";

let autoIncrUserIds: number = 0;

export const serverLogic = async (socket: Socket) => {
  // socket.write('I fucked up')
  await sendSerializedPacket(socket, GWP.SERVER_PASSWORD_REQUEST);
  socket.on("data", async (data: Uint8Array) => {
    /* 
       Using a random rumber in each session which client urges to send it to server. 
       It is not safe since not using crypto library.
       Just for showing the possible security which could be apply and avoiding any conflicts in the future. 
       */
    try {
      const requestCode: number = data[0];
      let userId: number = Number.MAX_SAFE_INTEGER;
      // if request is not AUTH we check the credentials
      if (requestCode !== GWP.AUTH_REQ) {
        try {
          let bytes: Uint8Array = Buffer.from(data.slice(1, 5));
          userId = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
          const claimedRandom: Buffer = Buffer.from(data.slice(5, 9));
          if (Buffer.compare(userIdList[userId].rnd, claimedRandom) != 0) {
            await sendSerializedPacket(socket, GWP.UNAUTHORIZED);
            return;
          }
        } catch (error) {
          await sendSerializedPacket(socket, GWP.SERVER_ERROR);
          return;
        }
      }
      // Decide what to do based on requestCode.
      switch (requestCode) {
        case GWP.AUTH_REQ:
          const userPasswd: string = data.slice(1).toString();
          if (userPasswd === passwd) {
            autoIncrUserIds++;
            let newUserId: number | null;
            newUserId = autoIncrUserIds;
            await sendSerializedPacket(socket, GWP.GEN_USER_ID, newUserId);
            // @ts-ignore
            socket.id = newUserId;
          } else {
            await sendSerializedPacket(socket, GWP.INCORRECT_PASSWORD);
          }
          break;
        case GWP.CHOOSE_STATE:
          const state: PLAYER_STATES = data[9];
          if (userIdList[userId].state !== PLAYER_STATES.PLAYING) {
            switch (state) {
              case PLAYER_STATES.WAITING:
                userIdList[userId].state = PLAYER_STATES.WAITING;
                await sendSerializedPacket(socket, GWP.ADDED_TO_WAITLIST, userId);
                break;
              case PLAYER_STATES.INVITING:
                let waitingBuffer = getWaitedUsersList(userIdList);
                if (waitingBuffer.length > 0) {
                  userIdList[userId].state = PLAYER_STATES.INVITING;
                }
                await sendSerializedPacket(socket, GWP.ADDED_TO_INVITE_LIST, userId, waitingBuffer);
                break;
              default:
                await sendSerializedPacket(socket, GWP.CANNOT_CHANGE_USER_STATE, userId);
            }
          }
          break;

        case GWP.USER_EXIT:
          delete userIdList[userId];
          socket.end();
          return;
        case GWP.SELECT_WAITED_USER:
          let bytes: Uint8Array = Buffer.from(data.slice(9, 13));
          let waitedUserId: number = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
          const word: string = data.slice(13).toString();
          if (userIdList?.[waitedUserId]?.state === undefined) {
            await sendSerializedPacket(socket, GWP.USER_ID_NOT_CORRECT, userId);
          } else if (userIdList?.[waitedUserId]?.state !== PLAYER_STATES.WAITING) {
            await sendSerializedPacket(socket, GWP.USER_ID_NOT_IN_WAITLIST, userId);
          } else {
            await sendSerializedPacket(
              userIdList[waitedUserId].socket,
              GWP.OFFER_MATCH,
              waitedUserId,
              new Uint8Array([...getUint8Numbers(userId), ...data.slice(13)])
            );
            gameList[`${userId}-${waitedUserId}`] = { inviterId: userId, guesserId: waitedUserId, word, conversation: {}, status: "not-started" };
          }
          break;

        case GWP.REJECT_MATCH:
          let opBytes = Buffer.from(data.slice(9, 13));
          let rivalId: number = (opBytes[0] << 24) | (opBytes[1] << 16) | (opBytes[2] << 8) | opBytes[3];
          await sendSerializedPacket(userIdList[rivalId].socket, GWP.USER_REJECTED_MATCH, rivalId, getWaitedUsersList(userIdList));
          break;

        case GWP.ACCEPT_MATCH:
          let inBytes = Buffer.from(data.slice(9, 13));
          let inviterUserId: number = (inBytes[0] << 24) | (inBytes[1] << 16) | (inBytes[2] << 8) | inBytes[3];
          await sendSerializedPacket(userIdList[inviterUserId].socket, GWP.USER_ACCEPTED_MATCH, inviterUserId, getUint8Numbers(userId));
          userIdList[userId].state = PLAYER_STATES.PLAYING;
          userIdList[inviterUserId].state = PLAYER_STATES.PLAYING;
          gameList[`${inviterUserId}-${userId}`] = { ...gameList[`${inviterUserId}-${userId}`], status: "Started" };
          break;

        case GWP.NEW_GUESS:
          let oponBytes = Buffer.from(data.slice(9, 13));
          let opponentUserId = (oponBytes[0] << 24) | (oponBytes[1] << 16) | (oponBytes[2] << 8) | oponBytes[3];
          const guess: Uint8Array = data.slice(13);
          
          let guessMessage: Message = { from: userId.toString(), userType: "Guesser", text: guess.toString() };
          gameList[`${opponentUserId}-${userId}`].conversation[Date.now().toString()] = guessMessage
          let result: string = "";
          if (gameList[`${opponentUserId}-${userId}`].word.toLocaleLowerCase().trim() == guess.toString().toLocaleLowerCase().trim()) {
            result = "win";
            userIdList[userId].state = PLAYER_STATES.WON;
            userIdList[opponentUserId].state = PLAYER_STATES.LOST;
          } else if (guess.toString().toLocaleLowerCase().trim() == "giveup") {
            result = "giveup";
            userIdList[userId].state = PLAYER_STATES.LOST;
            userIdList[opponentUserId].state = PLAYER_STATES.WON;
          }
          if (["win", "giveup"].includes(result)) {
            await sendSerializedPacket(
              userIdList[opponentUserId].socket,
              result === "win" ? GWP.USER_WINS : GWP.USER_GIVEUP,
              opponentUserId,
              data.slice(13),
              false
            ).then(() => {
              gameList[`${opponentUserId}-${userId}`] = { ...gameList[`${opponentUserId}-${userId}`], status: result === "win" ? 'Guesser Wins' : 'Inviter Wins' };
              socket.end();
              userIdList[opponentUserId].socket.end();
            });
          } else {
            await sendSerializedPacket(
              userIdList[opponentUserId].socket,
              GWP.NEW_MESSAGE,
              opponentUserId,
              new Uint8Array([...getUint8Numbers(userId), ...guess]),
              false
            );
          }
          break;

        case GWP.NEW_HINT:
          let wBytes = Buffer.from(data.slice(9, 13));
          let waiterId = (wBytes[0] << 24) | (wBytes[1] << 16) | (wBytes[2] << 8) | wBytes[3];
          const hint: Uint8Array = data.slice(13);
          let hintMessage: Message = { from: userId.toString(), userType: "Hinter", text: hint.toString() };
          gameList[`${userId}-${waiterId}`].conversation[Date.now().toString()] = hintMessage
          await sendSerializedPacket(userIdList[waiterId].socket, GWP.NEW_MESSAGE, waiterId, new Uint8Array([...getUint8Numbers(userId), ...hint]), false);
          break;
      }
    } catch (error) {
      await sendSerializedPacket(socket, GWP.SERVER_ERROR);
      socket.end();
    }
  });
  socket.on("error", () => {
    //@ts-ignore
    userIdList?.[socket?.id]?.state = PLAYER_STATES.EXITED;
  });
  socket.on("end", () => {
    //@ts-ignore
    userIdList?.[socket?.id]?.state = PLAYER_STATES.EXITED;
  });
};
