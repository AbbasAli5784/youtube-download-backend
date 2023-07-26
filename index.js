// server side imports
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
// ytdl imports and deps
const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");

const port = 3000;

// We are using our packages here
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies
app.use(cors());

//Route that handles getting the download information
app.post("/download", (req, res) => {
  let fileName;
  let streamOptions;

  if (req.body.fileType === "mp3") {
    fileName = req.body.fileName + ".mp3";
    streamOptions = {
      quality: "highestaudio",
      filter: "audioonly",
    };
  } else if (req.body.fileType === "mp4") {
    fileName = req.body.fileName + ".mp4";
    if (req.body.quality === "highestaudio") {
      streamOptions = {
        quality: "highestaudio",
        filter: "audioandvideo",
      };
    } else {
      streamOptions = {
        quality: "highest",
        filter: "videoonly",
      };
    }
  }

  let stream = ytdl(req.body.url, streamOptions);

  if (req.body.fileType === "mp3") {
    // convert video to mp3
    ffmpeg(stream)
      .audioBitrate(128)
      .save(fileName)
      .on("end", () => {
        res.download(fileName); // This will start the download on the client side.
      })
      .on("error", function (error) {
        console.log("Error in ffmpeg process: ", error);
        res.status(500).send("Error in ffmpeg process.");
      });
  } else if (req.body.fileType === "mp4") {
    if (req.body.quality === "highestaudio") {
      ffmpeg(stream)
        .save(fileName)
        .on("end", function () {
          res.download(fileName);
        })
        .on("error", function (error) {
          console.log("Error in ffmpeg process: ", error);
          res.status(500).send("Error in ffmpeg process.");
        });
    } else {
      stream
        .pipe(fs.createWriteStream(fileName))
        .on("finish", function () {
          res.download(fileName);
        })
        .on("error", function (error) {
          console.log("Error in download stream: ", error);
          res.status(500).send("Error in download stream.");
        });
    }
  }
});

//Start your server on a specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
