"use strict";

const fs = require("fs");
const path = require("path");

const { promisify } = require("util");

const Parameters = require("../parameters").get();
const Config = require("../config").getConfig();

const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

const getMinimal = pastEvents => {
  return pastEvents.map(tx => {
    return {
      transactionHash: tx.transactionHash,
      from: tx.returnValues.from,
      to: tx.returnValues.to,
      value: tx.returnValues.value._hex
    };
  });
};

module.exports.getEvents = async symbol => {
  const directory = Parameters.eventsDownloadFolder.replace(/{token}/g, symbol);
  var files = await readdirAsync(directory);
  files.sort((a,b) => {
    return parseInt(a.split(".")[0]) - parseInt(b.split(".")[0]);
  });
  let events = [];

  console.log("Parsing files.");

  for await (const file of files) {
    const block = Number(file.split(".")[0]);

    if (block > Config.toBlock) {
      console.log("stopping after block", block);
      break;
    }

    const contents = await readFileAsync(path.join(directory, file));
    const parsed = JSON.parse(contents.toString());
    events = events.concat(getMinimal(parsed));
  }

  return events;
};
