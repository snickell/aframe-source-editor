module.exports = function(grunt) {
  // run with
  //   nodemon -w Gruntfile.js -x grunt dev

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // -=-=-=-=-
    // js tests
    // -=-=-=-=-
    jshint: {
      files: ['Gruntfile.js', 'index.js', 'lib/**/*.js', 'tests/**/*.js'],
      options: {
        laxbreak: true,
        globals: {console: true, module: true, document: true}
      }
    },

    // -=-=-=-=-=-=-=-=-=-
    // fetching resources
    // -=-=-=-=-=-=-=-=-=-
    'curl-dir': {
      'update-ace': {
        src: ['https://github.com/ajaxorg/ace-builds/archive/master.tar.gz'],
        dest: 'vendor/ace/'
      },
      'update-lively.lang': {
        src: ['lively.lang.dev.js', 'lively.lang.dev.js.map'].map(function(ea) { return 'https://raw.githubusercontent.com/LivelyKernel/lively.lang/master/' + ea}),
        dest: 'vendor/'
      }
    },

    shell: {
      'ace-clean': {
        command: 'rm -rf *; ',
        options: {execOptions: {cwd: 'vendor/ace/'}}
      },
      'update-ace': {
        command: 'tar -xf master.tar.gz; mv ace-builds-master/src-noconflict/* .; '
               + 'rm -rf ace-builds-master master.tar.gz',
        options: {execOptions: {cwd: 'vendor/ace/'}}
      },
      runTests: {
        command: '<%= pkg.scripts.test %>',
        options: {execOptions: {}}
      }
    },

    // -=-=-=-=-=-=-=-
    // build bundles
    // -=-=-=-=-=-=-=-
    concat: {
      options: {sourceMap: true, sourceMapStyle: 'link', separator: ';\n'},
      "a-source-editor.dev.js": {
        src: ["vendor/ace/ace.js",
              "vendor/ace/ext-language_tools.js",
              "vendor/lively.lang.dev.js",
              "index.js",
              "lib/ace-helper.js",
              "lib/autocomplete.js",
              "lib/commands.js",
              "lib/canvas2d.js",
              "lib/domevents.js",
              "lib/raycasting.js",
              "lib/mouseevents.js",
              "lib/rendering.js",
              "lib/a-source-editor.js"],
        dest: "a-source-editor.dev.js"
      }
    },

    uglify: {
      "a-source-editor.min.js": {
        options: {
          sourceMap: true,
          preserveComments: (function() {
            var matcher = /BEGIN LICENSE BLOCK|Copyright/i;
            return function(node, comment) { return matcher.test(comment.value); }
          })(),
          banner: '/*! <%= pkg.name %>-v<%= pkg.version %> '
                + '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {"a-source-editor.min.js": "a-source-editor.dev.js"}
      }
    }

  });

  grunt.registerTask('test',               ['jshint', 'shell:runTests']);
  grunt.registerTask('update-ace',         ['shell:ace-clean', 'curl-dir:update-ace', 'shell:update-ace']);
  grunt.registerTask('update-lively.lang', ['curl-dir:update-lively.lang']);
  grunt.registerTask('updateLibs',         ['update-ace', 'update-lively.lang']);
  grunt.registerTask('build',              ['concat:a-source-editor.dev.js', 'uglify:a-source-editor.min.js']);
  
};
