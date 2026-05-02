import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "nodespace",
  isDev: process.env.NODE_ENV === "development",
});
