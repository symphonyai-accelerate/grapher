module.exports = {
  entry: "./modules/grapher.js",
  output: {
    path: "./build/",
    filename: "grapher.js",
    library: "Grapher",
    libraryTarget: "umd"
  },
  module: {
    loaders: [
      { test: /\.(glsl|frag|vert)$/, loader: 'raw', exclude: /node_modules/ },
      { test: /\.(glsl|frag|vert)$/, loader: 'glslify', exclude: /node_modules/ }
    ]
  }
};
