const express = require("express");
const axios = require("axios");

const app = express();

app.set("view engine", "ejs");

let currentStream = "";


/* -----------------------
TOKEN FETCH
----------------------- */

async function fetchNewToken() {

  console.log("Fetching new token...");

  // yaha tum scraper laga sakte ho

  currentStream =
    "https://n3.zohanayaan.com:1686/hls/starhindi.m3u8?md5=iUgp8LvDZJFPCC2ooL9u7w&expires=1775555562";

  return currentStream;

}


/* -----------------------
CHECK TOKEN EXPIRY
----------------------- */

function tokenExpired(url) {

  try {

    let exp = url.match(/expires=(\d+)/);

    if (!exp) return true;

    let expireTime = parseInt(exp[1]) * 1000;

    return Date.now() > expireTime - 30000; // 30 sec before expire

  } catch {

    return true;

  }

}


/* -----------------------
GET STREAM
----------------------- */

async function getStream() {

  if (!currentStream || tokenExpired(currentStream)) {

    console.log("Token expired → refreshing");

    await fetchNewToken();

  }

  return currentStream;

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

    let url = await getStream();

    let r = await axios.get(url, {
      headers: {
        Referer: "https://executeandship.com/",
        Origin: "https://executeandship.com"
      }
    });

    let base = url.substring(0, url.lastIndexOf("/") + 1);

    let data = r.data.replace(/(.*\.ts)/g,
      "/segment?file=$1&base=" + encodeURIComponent(base)
    );

    res.set("content-type", "application/vnd.apple.mpegurl");

    res.send(data);

  } catch (e) {

    console.log("Token expired, refreshing...");

    await fetchNewToken();

    res.redirect("/stream.m3u8");

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


app.listen(3001, () => {

  console.log("server running");

});