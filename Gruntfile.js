module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Timing the build tasks.
  require('time-grunt')(grunt);

  grunt.initConfig({
    clean: {
      dist: 'dist/*.js'
    },
    jshint: {
      options: {
        reporter: require('jshint-stylish'),
        jshintrc: true
      },
      dist: {
        src: ['lib/*.js']
      },
      test: {
        src: ['tests/*.js']
      }
    },
    mochaTest: {
      test: {
        src: ['tests/**/*.js']
      }
    }
  });

  // Registering the tasks.
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['clean', 'jshint', 'test']);
};