module.exports = function ( grunt ) {
  'use strict';

  grunt.util.linefeed = '\n';

  var fs = require( 'fs' );
  var configBridge = grunt.file.readJSON( './grunt/configBridge.json', { encoding: 'utf8' });

  grunt.initConfig({

    // Metadata
    pkg: grunt.file.readJSON( 'package.json' ),
    banner: '/*!\n' +
            ' * Bootstrap v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2011-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
            ' * Licensed under the <%= pkg.license %> license\n' +
            ' */\n',
    jqueryCheck: configBridge.config.jqueryCheck.join( '\n' ),
    jqueryVersionCheck: configBridge.config.jqueryVersionCheck.join( '\n' ),

    // Task configuration
    jshint: {
      options: {
        jshintrc: 'js/.jshintrc'
      },
      grunt: {
        options: {
          jshintrc: 'grunt/.jshintrc'
        },
        src: [ 'Gruntfile.js', 'package.js', 'grunt/*.js' ]
      },
      core: {
        src: 'js/*.js'
      },
      test: {
        options: {
          jshintrc: 'js/tests/unit/.jshintrc'
        },
        src: 'js/tests/unit/*.js'
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>\n<%= jqueryCheck %>\n<%= jqueryVersionCheck %>',
        stripBanners: false
      },
      bootstrap: {
        src: [
          'js/transition.js',
          'js/alert.js',
          'js/button.js'
        ],
        dest: 'dist/js/<%= pkg.name %>.js'
      }
    },

    less: {
      compileCore: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFile: true,
          sourceMapURL: '<%= pkg.name %>.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>.css.map'
        },
        src: 'less/bootstrap.less',
        dest: 'dist/css/<%= pkg.name %>.css'
      },
      compileTheme: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFile: true,
          sourceMapURL: '<%= pkg.name %>-theme.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>-theme.css.map'
        },
        src: 'less/theme.less',
        dest: 'dist/css/<%= pkg.name %>-theme.css'
      }
    },

    autoprefixer: {
      options: {
        browsers: configBridge.config.autoprefixerBrowsers
      },
      core: {
        options: {
          map: true
        },
        src: 'dist/css/<%= pkg.name %>.css'
      },
      theme: {
        options: {
          map: true
        },
        src: 'dist/css/<%= pkg.name %>-theme.css'
      }
    },

    csslint: {
      options: {
        csslintrc: 'less/.csslintrc'
      },
      dist: [
        'dist/css/<%= pkg.name %>.css',
        'dist/css/<%= pkg.name %>-theme.css'
      ]
    },

    watch: {
      src: {
        files: '<%= jshint.core.src %>',
        tasks: [ 'jshint:core', 'concat' ]
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: 'jshint:test'
      },
      less: {
        files: 'less/**/*.less',
        tasks: 'less'
      }
    }

  });

  require( 'load-grunt-tasks' )( grunt, { scope: 'devDependencies' });

};
