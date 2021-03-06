'use strict';
module.exports = grunt => {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    babel: {
      options: {
        presets: ['es2015']
      },
      client: {
        options: {
          sourceMap: true
        },
        files: [
        {
          expand: true, 
          cwd:'./src/js/', 
          src: ['*.js'], 
          dest: './.tmp/',
        }]
      }
    },
    clean: {
      public: ["dist/"],
      tmp: [".tmp/"]
    },
    copy: {
      main: {
        expand: true,
        cwd: 'src/assets/txt/',
        src: '**.txt',
        dest: 'dist/assets/txt/',
      },
      css: {
        expand:true,
        cwd: 'src/css/',
        src: '**.css',
        dest: 'dist/assets/css/',
      }
    },
    browserify: {
      bundle: {
        options: {
          exclude: ['wordnet-db', 'lapack'],
          require: [
                'teoria',
                'noteplayer',
                'soundfont-player',
                'tocktimer', 
                'markovchain-generate',
                'd3',
                'markov',
                'natural',
                'random-seed',
                'shuffle',
                'crypto'
              ]
        },
        files: {
          '.tmp/bundle.js': ['./.tmp/graph.js']
        }
      }
    },
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: ['.tmp/bundle.js', '.tmp/index.js'],
        dest: 'dist/static/js/bundle.js',
      },
    },
    jade: {
      release: {
        options: {
          data: {
            debug: false
          },
          pretty: true
        },
        files: {
          "dist/index.html": ["src/jade/sub/content.jade"]
        },
        compile: {
          expand: true
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 8080,
          base: {
            path: 'dist',
            options: {
              index: 'index.html',
              maxAge: 300000
            }
          },
        }
      }
    },
    watch: {
      options: {
        spawn: false,
      },
      jade: {
        files: ['**/*.jade'],
        tasks: ['jade'],
      },
      js: {
        files: ['src/js/*.js'],
        tasks: ['babel', 'browserify', 'concat']
      }
    },
  });

  grunt.registerTask('default', ['clean:public', 'babel', 'browserify', 'jade', 'concat', 'copy', 'clean:tmp', 'watch']);
  grunt.registerTask('deploy', ['ftp-deploy']);
};