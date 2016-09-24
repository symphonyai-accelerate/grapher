module.exports = function (grunt) {
  grunt.initConfig({
    jasmine: {
      base: {
        src: 'build/grapher.js',
        options: {
          specs: 'spec/*Spec.js'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-jasmine');
};
