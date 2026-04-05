/** אירוע חלון — נשלח מ־RealtimeEventBridge כשמגיע עדכון מ־SSE */
export const HH_REALTIME_EVENT = "hh-realtime";

export type RealtimePayload =
  | { type: "badges"; notifications: number; messages: number }
  | {
      type: "conversation";
      conversationId: number;
      messageLatestId: number;
    };
