require('dotenv').config();
const express = require("express");
const axios = require("axios");

const app = express();

app.set("view engine", "ejs");

/* STREAM STORAGE */

let streams = {
  1: "",
  2: "",
  3:""
};

/* -----------------------
TOKEN FETCH
----------------------- */

async function fetchNewToken(ch) {

  console.log("Fetching new token for channel:", ch);

  if (ch == 1) {

    streams[1] =
      process.env.willow;

  }

  if (ch == 2) {

    streams[2] =
      process.env.Hindi;

  }
  if (ch == 3) {

    streams[3] =
      process.env.English;

  }

  return streams[ch];
}

/* -----------------------
CHECK TOKEN EXPIRY
----------------------- */

function tokenExpired(url) {

  try {

    let exp = url.match(/expires=(\d+)/);

    if (!exp) return true;

    let expireTime = parseInt(exp[1]) * 1000;

    return Date.now() > expireTime - 30000;

  } catch {

    return true;

  }

}

/* -----------------------
GET STREAM
----------------------- */

async function getStream(ch) {

  if (!streams[ch] || tokenExpired(streams[ch])) {

    console.log("Token expired → refreshing");

    await fetchNewToken(ch);

  }

  return streams[ch];

}

/* -----------------------
PAGE
----------------------- */

app.get("/", (req, res) => {

  res.render("player");

});

/* -----------------------
M3U8 PROXY
----------------------- */

app.get("/stream.m3u8", async (req, res) => {

  try {

    let ch = req.query.ch || 1;

    let url = await getStream(ch);

    let r = await axios.get(url, {
      headers: {
        Referer: "https://executeandship.com/",
        Origin: "https://executeandship.com"
      }
    });

    let base = url.substring(0, url.lastIndexOf("/") + 1);

    let data = r.data.replace(/(.*\.ts)/g,
      `/segment?file=$1&base=${encodeURIComponent(base)}`
    );

    res.set("content-type", "application/vnd.apple.mpegurl");

    res.send(data);

  } catch (e) {

    console.log("Token expired refreshing");

    let ch = req.query.ch || 1;

    await fetchNewToken(ch);

    res.redirect(`/stream.m3u8?ch=${ch}`);

  }

});

/* -----------------------
TS SEGMENT PROXY
----------------------- */

app.get("/segment", async (req, res) => {

  try {

    let file = req.query.file;
    let base = req.query.base;

    let url = base + file;

    let r = await axios.get(url, {

      responseType: "stream",

      headers: {
        Referer: "https://executeandship.com/",
        Origin: "https://executeandship.com"
      }

    });

    r.data.pipe(res);

  } catch (e) {

    console.log("segment error");

    res.status(404).send();

  }

});

app.listen(3000, () => {

  console.log("Server running on port 3000");

});