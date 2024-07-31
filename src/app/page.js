"use client";
import { useEffect, useState } from "react";
import { Input, Spinner } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Text } from "@chakra-ui/react";
import empty from "./empty.svg";
import Preview from "./components/Preview";
import Image from "next/image";

export default function Home() {
  const [twitchName, setTwitchName] = useState("");
  const [eventSource, setEventSource] = useState();
  const [status, setStatus] = useState(null);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("twitchname");
    if (query && query !== twitchName) {
      setTwitchName(query);
      connect(query);
    }
  }, []);

  async function disconnect() {
    eventSource.close();
    setStatus(null);
    setEventSource(null);
    const newUrl = window.location.origin;
    window.history.pushState({ path: newUrl }, "", newUrl);
  }

  async function connect(name) {
    try {
      setStatus("loading");
      const eventSource = new EventSource(`/api/sse/${name}`);
      var _links = [];
      eventSource.onmessage = async (event) => {
        const { link, user, msg, __ready, __error, ...extra } = JSON.parse(
          event.data
        );
        if (__ready) {
          const newUrl = `${window.location.origin}/?twitchname=${name}`;
          window.history.pushState({ path: newUrl }, "", newUrl);
          return setStatus("ready");
        }
        if (__error) {
          return setStatus("error");
        }

        const ll = link.toLowerCase();
        const existing = _links.find((ex) => ex.link.toLowerCase() === ll);

        if (existing) {
          _links = _links.map((l) =>
            l.link === existing.link
              ? { ...l, msgs: [...l.msgs, { user, msg }] }
              : l
          );
        } else {
          _links = [
            ..._links,
            {
              ...extra,
              link,
              msgs: [{ user, msg }],
            },
          ];
        }

        setLinks(_links);
      };
      setEventSource(eventSource);
    } catch (e) {
      setStatus("error");
      console.log(`🦊 - connect - e:`, e);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 pt-12 w-full relative gap-8">
      <Text
        fontSize="8xl"
        className="text-purple-100 font-bold zawafont tracking-wide	"
      >
        ZAWALINK
      </Text>
      {status !== "ready" ? (
        <div className="flex flex-col gap-4 w-full items-center">
          <form
            className="flex w-full max-w-screen-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (status !== "loading" && twitchName.length)
                connect(twitchName);
            }}
          >
            <div className="flex w-full  bg-white border border-white rounded">
              <fieldset className="flex flex-grow">
                <Input
                  id="twitchname"
                  name="twitchname"
                  autocomplete="twitchname"
                  placeholder="Chaine twitch à scanner..."
                  type="text"
                  required
                  disabled={status === "loading"}
                  value={twitchName}
                  // onKeyDown={(e) => e.key === "Enter" && connect(twitchName)}
                  onChange={(e) => {
                    setStatus(null);
                    setTwitchName(e.target.value);
                  }}
                />
                <datalist id="twitchname">
                  <option value="Black" />
                  <option value="Red" />
                  <option value="Green" />
                  <option value="Blue" />
                  <option value="White" />
                </datalist>
              </fieldset>
              <Button
                type="submit"
                value="Submit"
                disabled={status === "loading" || !twitchName.length}
                colorScheme={status === "error" ? "red" : "purple"}
              >
                {status === "loading" ? <Spinner /> : "Connect"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <Text
            fontSize="xl"
            className="text-white font-bold fixed top-4 left-6 uppercase"
          >
            {twitchName}
          </Text>
          <div className="fixed top-2  right-2 flex items-center">
            <Button colorScheme="dark" opacity={0.3} onClick={disconnect}>
              disconnect
            </Button>
          </div>
        </div>
      )}
      {links.length > 0 ? (
        <div className="max-w-xl w-xl bg-gray-200 border border-white rounded p-8 flex flex-row-reverse gap-4 flex-wrap-reverse items-center justify-between">
          {links.map(({ link, ...infos }) => {
            return <Preview key={link} link={link} infos={infos} />;
          })}
        </div>
      ) : (
        <Image
          width={300}
          height={300}
          src={empty}
          alt="empty"
          className={`m-auto ${
            status === "ready" || status === "loading"
              ? "animate-pulse opacity-40"
              : ""
          } `}
        />
      )}
    </main>
  );
}
