import { GWP, PLAYER_STATES, UserList } from "./declarations";
import { userIdList } from "./globals";

export const getUint8Numbers = (num: number): Uint8Array => {
  const byteArray: Uint8Array = new Uint8Array(4);
  byteArray[0] = (num >> 24) & 0xff;
  byteArray[1] = (num >> 16) & 0xff;
  byteArray[2] = (num >> 8) & 0xff;
  byteArray[3] = num & 0xff;
  return byteArray;
};

export const sendSerializedPacket = (
  socket: any,
  responseCode: GWP,
  userId: number | undefined = undefined,
  payload: Uint8Array = new Uint8Array([]),
  updateSessionId: boolean = true
): Promise<boolean> =>
  new Promise((resolve) => {
    if (!userId) {
      socket.write(new Uint8Array([responseCode]));
      return resolve(true);
    }
    const randomSessionId: Uint8Array = getUint8Numbers(Math.floor(Math.random() * Math.pow(2, 32)));
    userIdList[userId] = {
      ...userIdList[userId],
      state: userIdList[userId]?.state || PLAYER_STATES.NONE,
      socket: userIdList[userId]?.socket || socket,
      ...(updateSessionId && { rnd: Buffer.from(randomSessionId) }),
    };
    let _rt: Uint8Array = new Uint8Array([responseCode, ...getUint8Numbers(userId), ...randomSessionId, ...payload]);
    socket.write(_rt);
    return resolve(true);
  });

export const getWaitedUsersList = (userIdList: UserList): Uint8Array => {
  let waitingList = Object.keys(userIdList)
    .filter((user: any) => userIdList[user].state == PLAYER_STATES.WAITING)
    .map((id) => parseInt(id));
  let waitBuffer: Uint8Array = new Uint8Array(waitingList.length * 4);
  waitingList.forEach((id, index): void => {
    waitBuffer.set(getUint8Numbers(id), index * 4);
  });
  return waitBuffer;
};
