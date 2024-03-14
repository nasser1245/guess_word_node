/*
  Guess The Word Protocol (GWP) Codes
  Types of interchangable codes:
    0x00 - 0x3F => Server responses
    0x40 - 0x7F => Server raised errors

    0x80 - 0xBF => Client request
 */

export enum GWP {
  // Server Codes
  SERVER_PASSWORD_REQUEST = 0x00, //	Enter password
  GEN_USER_ID = 0x01, // Generated UserId
  ADDED_TO_WAITLIST = 0x02, // User added to wait list
  ADDED_TO_INVITE_LIST = 0x03, // User added to invite list
  CURRENT_WAITED_USERS = 0x04, //	Current waited users
  OFFER_MATCH = 0x05, // Offer a match
  USER_ACCEPTED_MATCH = 0x06, // Message Sent
  NEW_MESSAGE = 0x07, // New Message
  USER_GIVEUP = 0x08, // User GivesUp
  USER_WINS = 0x09, // User Wins

  // Server Errors
  SERVER_ERROR = 0x40, //	Server Error
  UNAUTHORIZED = 0x41, //	Server Error
  INCORRECT_PASSWORD = 0x42, //	Password incorrect
  CANNOT_CHANGE_USER_STATE = 0x43, // Can't change user's state
  USER_ID_NOT_IN_WAITLIST = 0x44, // UserId is not in waiting list
  USER_ID_NOT_CORRECT = 0x45, // UserId not correct
  USER_REJECTED_MATCH = 0x46, // User Rejected the match offer
  MESSAGE_NOT_SENT = 0x47, // Message does not sent
  INVITER_EXITED = 0x48, // Inviter user exited
  WAITER_EXITED = 0x49, //Waiter user exitted

  // Client Codes
  AUTH_REQ = 0x80, // Send password
  CHOOSE_STATE = 0x81, // Choose state	Values (W for Wait, I for invite players, E for Exit)
  SELECT_WAITED_USER = 0x82, // Select from a waiting user List	Waiting user Id, word
  ACCEPT_MATCH = 0x83, // Accept the match
  REJECT_MATCH = 0x84, // Reject the match offer
  NEW_GUESS = 0x85, // New Guess Sent
  NEW_HINT = 0x86, // New Hint Sent
  USER_EXIT = 0x87, // Exit from game
}
export enum PLAYER_STATES {
  NONE = 0x00,
  WAITING = 0x01,
  PLAYING = 0x02,
  INVITING = 0x03,
  EXITED = 0x04,
  WON = 0X05,
  LOST = 0X06
}