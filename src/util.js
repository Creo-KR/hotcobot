const fs = require("fs");

module.exports.writeData = (data) => {
  fs.writeFileSync("./data.json", JSON.stringify(data, undefined, "  "));
};
