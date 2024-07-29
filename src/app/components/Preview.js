"use client";
import { Button, Card, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { TwitchClip } from "react-twitch-embed";
import { TwitchPlayerNonInteractive } from "react-twitch-embed";
import Image from "next/image";
import { Badge } from "@chakra-ui/react";
import { Tooltip } from "@chakra-ui/react";
import { InstagramEmbed, TikTokEmbed } from "react-social-media-embed";
import { XEmbed } from "react-social-media-embed";

const twitterRgxp =
  /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

const PreviewMap = {
  Default: function (link, { title, description, image, site_name }) {
    return (
      <div className="relative flex flex-col gap-2">
        <div className="relative">
          {image && (
            <div className="w-full h-24">
              <Image
                src={image}
                alt={""}
                width={500}
                height={300}
                className="rounded w-full h-24 object-cover	"
              />
            </div>
          )}
          <Text
            fontSize={image ? "2xl" : "md"}
            fontStyle="italic"
            className={`font-medium ${
              image ? "absolute" : "relative"
            } top-0 left-0 text-white bg-purple-800 bg-opacity-65 px-4  rounded max-w-full`}
          >
            {image ? site_name || new URL(link).host : link.split("://").pop()}
          </Text>
        </div>

        <Text fontWeight="bold">{title}</Text>
        <Text fontStyle="italic">{description}</Text>
      </div>
    );
  },
  Twitch: function (link) {
    const parts = link.split("/");
    // "https://www.twitch.tv/emmodem/clip/ArtsyFunWatercressCharlieBitMe-wn3OiODgwN0ARgED":
    if (link.includes("/clip/") || link.includes("/clips.twitch.tv/")) {
      const idx =
        parts.indexOf("clip") !== -1
          ? parts.indexOf("clip")
          : parts.indexOf("clips.twitch.tv");
      const clip = parts[idx + 1];

      return (
        <TwitchClip
          clip={clip}
          autoplay={false}
          width="100%"
          height={300}
          muted
        />
      );
    }

    //https://www.twitch.tv/videos/2204373706
    if (link.includes("/videos/")) {
      const video = parts[parts.indexOf("videos") + 1];
      return (
        <TwitchPlayerNonInteractive
          video={video}
          muted
          width="100%"
          height={300}
          autoplay={false}
        />
      );
    }

    const channel = parts.pop().split("?")[0];
    return (
      <TwitchPlayerNonInteractive
        channel={channel}
        autoplay={false}
        muted
        width="100%"
        height={300}
      />
    );
  },

  Youtube: function (link, infos) {
    const match = link.match(twitterRgxp);
    let id = match && match[7].length == 11 ? match[7] : false;
    if (link.includes("/live/")) id = link.split("/").pop().split("?")[0];
    if (!id) return PreviewMap.Default(link, infos);

    return (
      <iframe
        id="player"
        type="text/html"
        width="100%"
        height="200"
        src={`http://www.youtube.com/embed/${id}?mute=1`}
      ></iframe>
    );
  },
  Tiktok: function (link, infos) {
    return <TikTokEmbed url={link} width="100%" style={{ height: "580px" }} />;
  },
  Twitter: function (link, infos) {
    return <XEmbed url={link} width="100%" />;
  },
  Instagram: function (link, infos) {
    return <InstagramEmbed url={link} width="100%" captioned={false} />;
  },
};

export default function Preview({ link, infos }) {
  const [hide, setHide] = useState(false);
  const Component = useMemo(() => {
    return PreviewMap[infos.type](link, infos);
  }, []);

  if (hide) return null;

  return (
    <div
      className="animate-fade flex-grow max-w-xl min-w-96 cursor-pointer"
      onClick={() => window.open(link, "__blank")}
    >
      <Tooltip label={link} placement="top">
        <Card className="flex w-full flex-col gap-2 relative group">
          <div
            key={link}
            className="border  border-gray-400 shadow-md rounded p-4  pb-2 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              {infos.msgs.map(({ user, msg }, idx) => (
                <div
                  className={`flex !flex-row gap-2 ${msg ? "!bg-purple-50 shadow" : ""}`}
                  key={`${user}-${idx}`}
                >
                  <Badge className="h-min !px-2 py-0.5 !rounded-md !bg-purple-300 relative -bottom-0.5">
                    {user}
                  </Badge>
                  <Text className="relative -top-0.5	">{msg}</Text>
                </div>
              ))}
            </div>
            {Component}

            <div className="absolute -top-5 -right-4 z-10">
              <Button
                onClick={(e) => {
                  setHide(true);
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="w-10 h-20 !bg-red-200 opacity-0 group-hover:opacity-65 hover:!opacity-100"
              >
                X
              </Button>
            </div>
          </div>
        </Card>
      </Tooltip>
    </div>
  );
}
