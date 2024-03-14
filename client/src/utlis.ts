import { connection } from "./client";
import { GWP, PLAYER_STATES } from "./declarations";

export const readInput = async (message: string, isPassword: boolean = false): Promise<string> => {
  const readline = require("node:readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const keypressListener = (char: string, key: any) => {
    if (!key || key.name === "return" || key.name === "enter") {
      return;
    }
    process.stdout.moveCursor(-1, 0);
    process.stdout.write("*");
  };

  if (isPassword) {
    process.stdin.on("keypress", keypressListener);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  const choise: string = await new Promise((resolve) => {
    readline.question(message, resolve);
  });

  if (isPassword) {
    process.stdin.setRawMode(false);
    process.stdin.removeListener("keypress", keypressListener);
  }
  readline.close();
  return choise;
};

export const getUint8Numbers = (num: number): Uint8Array => {
  const byteArray: Uint8Array = new Uint8Array(4);
  byteArray[0] = (num >> 24) & 0xff;
  byteArray[1] = (num >> 16) & 0xff;
  byteArray[2] = (num >> 8) & 0xff;
  byteArray[3] = num & 0xff;
  return byteArray;
};

export const sendSerializedPacket = async (serverResponse: Uint8Array, requestCode: GWP, payload: Uint8Array = new Uint8Array([])): Promise<boolean> => {
  return new Promise((resolve) => {
    let responseCode: number = serverResponse[0];
    if (responseCode == GWP.SERVER_PASSWORD_REQUEST || responseCode == GWP.INCORRECT_PASSWORD) {
      connection.write(new Uint8Array([GWP.AUTH_REQ, ...payload]), () => resolve(true));
    }else{
      connection.write(new Uint8Array([requestCode, ...serverResponse.slice(1, 9), ...payload]), () => resolve(true));
    }
  });
};

export const selectOption = async (message: string, options: string[] = []): Promise<string> => {
  while (true) {
    const choise: string = await readInput(message);
    if (options.length == 0 || options.includes(choise)) {
      return choise;
    } else if (!options.includes(choise)) {
      console.log("\nPlease select one of the options provided\n");
    }
  }
};

export const inviteToMatch = async (data: Uint8Array) => {
  let uint8WaitingList: Uint8Array = data.slice(9);
  if (uint8WaitingList.length === 0) {
    const choise: string = await selectOption(
      "Sorry, currently nobody is in the waiting list, please select one of this options:\n  [w] Wait for invite a player\n  [q] Quit\n\nMy choise: ",
      ["w", "q"]
    );
    if (choise == "q") {
      sendSerializedPacket(data, GWP.USER_EXIT).then(() => {
        console.log("Have a nice day!");
        process.exit();
      });
    } else if (choise == "w") {
      sendSerializedPacket(data, GWP.CHOOSE_STATE, new Uint8Array(1).fill(PLAYER_STATES.WAITING));
    }
  } else {
    let waitingListIds: number[] = [];
    for (let i = 0; i < uint8WaitingList.length; i += 4) {
      const bytes = uint8WaitingList.slice(i, i + 4);
      const value = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
      waitingListIds.push(value);
    }
    let idsMessage: string = "Invite users from the list (Enter the number inside the brackets):\n";
    let choises: string[] = [];
    waitingListIds.forEach((id: number, i: number) => {
      idsMessage += `\n [${i + 1}] with id number ${id}`;
      choises.push(`${i + 1}`);
    });
    idsMessage += "\n\nMy choise: ";
    const choise: string = await selectOption(idsMessage, choises);
    const word: string = await selectOption("What is your word to guess? ", []);
    const byteWord: Uint8Array = new TextEncoder().encode(word);
    console.log(`Choise is: ${waitingListIds[parseInt(choise) - 1]}`)
    let payload: Uint8Array = new Uint8Array([...getUint8Numbers(waitingListIds[parseInt(choise) - 1]), ...byteWord]);
    sendSerializedPacket(data, GWP.SELECT_WAITED_USER, payload).then(() =>
    console.log("Request were sent. Please wait until the invitee user either accepts or rejects the request.")
  );
  }
};
