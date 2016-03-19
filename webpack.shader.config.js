module.exports = {
  entry: "./modules/renderers/gl/shaders/shaders.js",
  module: {
    loaders: [
      { test: /\.(glsl|frag|vert)$/, loader: 'raw', exclude: /node_modules/ },
      { test: /\.(glsl|frag|vert)$/, loader: 'glslify', exclude: /node_modules/ }
    ]
  },
  output: {
    path: "./modules/renderers/gl/shaders/",
    filename: "bundle.js",
    library: "shaders",
    libraryTarget: "commonjs2"
  }
};
