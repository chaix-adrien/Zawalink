import { getSSEWriter } from "ts-sse";
import { ChatClient } from "dank-twitch-irc";
import { parser } from "html-metadata-parser";

const urlRgxp =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gm;

function getType(host) {
  if (["x.com", "twitter.com"].includes(host)) return "Twitter";
  if (["youtube.com", "youtu.be"].includes(host)) return "Youtube";
  if (["instagram.com"].includes(host)) return "Instagram";
  if (["tiktok.com"].includes(host)) return "Tiktok";
  if (["twitch.tv"].includes(host)) return "Twitch";
  return "Default";
}

export async function GET(req, { params: { twitchname } }) {
  console.log(
    `🦊 - client.on - process.env.BLACKLIST_USERS:`,
    process.env.BLACKLIST_USERS
  );
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  let client = new ChatClient();
  const syncStatusStream = async (notifier) => {
    client.on("close", (error) => {
      notifier.close();
      if (error != null) {
        console.error("Client closed due to error", error);
      }
    });

    client.on("PRIVMSG", async (msg) => {
      if (
        process.env.BLACKLIST_USERS.split(",").includes(
          msg.senderUsername.toLocaleLowerCase()
        )
      ) {
        return;
      }
      const txt = msg.messageText;
      const urls = txt.match(urlRgxp);
      if (urls) {
        await Promise.all(
          urls.map(async (fullUrl) => {
            const host = new URL(fullUrl).host.replace("www.", "");
            const type = getType(host);
            const url = type === "Youtube" ? fullUrl : fullUrl.split("?")[0];
            //console.log(`🦊 - urls.map - url:`, url);
            let extra = {};
            //console.log(`🦊 - urls.map - msg:`, msg);

            if (type === "Default") {
              try {
                const rep = await parser(url);
                extra = { ...rep.meta, ...rep.og };
              } catch (e) {
                console.log(`🦊 - issue while fetching extra metadata.`);
              }
            }
            notifier.update({
              data: {
                ...extra,
                link: url,
                type,
                user: msg.displayName,
                msg: txt.replace(urlRgxp, " "),
              },
            });
          })
        );
      }
    });

    // See below for more events

    await client.connect();

    try {
      await client.join(twitchname.trim().toLowerCase());
      console.log("Successfully connected to chat");
      notifier.update({
        data: {
          __ready: true,
        },
      });
    } catch (e) {
      console.log(`🦊 - Issue while joining twitch chat:`);
      notifier.update({
        data: {
          __error: true,
        },
      });
    }
  };

  syncStatusStream(getSSEWriter(writer, encoder));

  req.signal.addEventListener("abort", () => {
    console.log("Connection closed");
    client.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
