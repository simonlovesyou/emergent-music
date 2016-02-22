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
                'audio-slot',
                'audio-slot/sources/oscillator',
                'audio-slot/processors/filter',
                'audio-slot/params/envelope',
                'audio-slot/params/lfo'
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
        src: ['.tmp/bundle.js', '.tmp/index.js', './src/js/vendor/midi/build/MIDI.js'],
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
    copy: {
      bundle: {
        files: [{
          expand: true, 
          cwd:'src/soundsfonts/FluidR3_GM/', 
          src: ['**/*.mp3'], 
          dest: 'dist/static/soundfonts/', 
          filter: 'isFile'}
        ]
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
        files: ['**/*.js'],
        tasks: ['babel', 'browserify', 'concat']
      }
    },
  });

  grunt.registerTask('default', ['clean:public', 'babel', 'browserify', 'jade', 'concat', 'clean:tmp', 'copy', 'watch']);
  grunt.registerTask('deploy', ['ftp-deploy']);
};