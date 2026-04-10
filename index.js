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

  res.render("home");

});

// loading page
app.get("/watch", (req,res)=>{
  res.render("loading");
});

// redirect to real stream
app.get("/stream-live", (req,res)=>{
  res.redirect("https://sixstorm-live.onrender.com/star_sport_1_live_HD_ipl");
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
app.get("/watch-ipl", (req, res) => {
  const streamUrl = "https://muc002.myturn1.top:8088/live/webcrichindi/playlist.m3u8?vidictid=205534258389&id=119771&pk=79e3899a413e33bd1efbcd09d0df173a7466c907e5f9e0de621d8f6980f1723742af9682fa688effb9eb3c3c582b0f7d7e9bfe439ef06324ae33cfefd121eede";

  res.render("watch", {
    title: "SixStorm Live",
    streamUrl

  });
});

app.get("/star-sport", (req, res) => {
  const streamUrl = "https://mut001.myturn1.top:8088/live/starsports01/playlist.m3u8?vidictid=205531031866&id=123144&pk=79e3899a413e33bd1efbcd09d0df173a7466c907e5f9e0de621d8f6980f1723742af9682fa688effb9eb3c3c582b0f7d7e9bfe439ef06324ae33cfefd121eede";

  res.render("watch2", {
    title: "SixStorm Live",
    streamUrl
    
  });
});


app.get("/live",(req,res)=>{

res.render("player2",{
stream:"http://103.157.248.140:8000/play/a01m/index.m3u8"
})

})
app.listen(3000, () => {

  console.log("Server running on port 3000");

});