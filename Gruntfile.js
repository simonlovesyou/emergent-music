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
        files: {
          '.tmp/index.js': 'src/js/index.js'
        }
      }
    },
    clean: {
      public: ["dist/"],
      tmp: [".tmp/"]
    },
    browserify: {
      bundle: {
        options: {
          require: [
                'teoria',
                'noteplayer'
              ]
        },
        files: {
          '.tmp/bundle.js': ['./tmp/index.js']
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

  grunt.registerTask('default', ['clean:public', 'babel', 'browserify', 'jade', 'concat', 'clean:tmp', 'watch']);
  grunt.registerTask('deploy', ['ftp-deploy']);
};