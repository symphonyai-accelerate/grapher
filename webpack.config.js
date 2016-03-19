module.exports = {
  entry: "./modules/grapher.js",
  output: {
    path: "./build/",
    filename: "grapher.js",
    library: "Grapher",
    libraryTarget: "umd"
  }
};
