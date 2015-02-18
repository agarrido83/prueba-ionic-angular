// File: Gulpfile.js
'use strict';

// DESARROLLO
var gulp    = require('gulp'),
    connect = require('gulp-connect'),
    jshint  = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    stylus  = require('gulp-stylus'),
    nib     = require('nib'),
    inject  = require('gulp-inject'),
    wiredep = require('wiredep').stream,
    historyApiFallBack = require('connect-history-api-fallback');

// Servidor web de desarrollo
gulp.task('server', function() {
  connect.server({
    root: './www',
    hostname: '0.0.0.0',
    port: 8080,
    livereload: true,
    middleware: function(connect, opt) {
      return [ historyApiFallBack ];
    }
  });
});

// Busca errores en el JS y nos los muestra por pantalla
gulp.task('jshint', function() {
  return gulp.src('./www/js/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

// Procesa archivos Stylus a CSS y recarga los cambios
gulp.task('css', function() {
  gulp.src('./www/css/main.styl')
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest('./www/css'))
    .pipe(connect.reload());
});

// Recarga el navegador cuando hay cambios en el HTML
gulp.task('html', function() {
  gulp.src('./www/**/*.html')
    .pipe(connect.reload());
});

// Busca en las carpetas de estilos y javascript los archivos que hayamos creado
// para inyectarlos en el index.html
gulp.task('inject', function() {
  var sources = gulp.src(['./www/js/**/*.js', './www/css/**/*.css']);
  return gulp.src('index.html', { cwd: './www' })
    .pipe(inject(sources, {
      read: false,
      ignorePath: '/www'
    }))
    .pipe(gulp.dest('./www'));
});

// Inyecta las librerías que instalemos vía Bower
gulp.task('wiredep', function() {
  gulp.src('./www/index.html')
    .pipe(wiredep({
      directory: './www/lib'
    }))
    .pipe(gulp.dest('./www'));
});

// Vigila cambios que se produzcan en el código
// y lanza las tareas relacionadas
gulp.task('watch', function() {
  gulp.watch(['./www/**/*.html'], ['html']);
  gulp.watch(['./www/css/**/*.styl'], ['css', 'inject']);
  gulp.watch(['./www/js/**/*.js', './Gulpfile.js'], ['jshint', 'inject']);
  gulp.watch(['./bower.json'], ['wiredep'])
})

gulp.task('default', ['server', 'inject', 'wiredep', 'watch']);

// PRODUCCIÓN
var templatecache = require('gulp-angular-templatecache'),
    gulpif    = require('gulp-if'),
    minifyCss = require('gulp-minify-css'),
    useref    = require('gulp-useref'),
    uglify    = require('gulp-uglify'),
    uncss     = require('gulp-uncss');

// Cacheado de plantillas
gulp.task('templates', function() {
  gulp.src('./www/views/**/*.tpl.html')
    .pipe(templatecache({
      root: 'views/',
      module: 'app.templates',
      standalone: true
    }))
    .pipe(gulp.dest('./www/js'));
});

// Pasamos los archivos minificados y concatenados a /dist
gulp.task('compress', function() {
  gulp.src('./www/index.html')
    .pipe(useref.assets())
    .pipe(gulpif('*.js', uglify({mangle: false })))
    .pipe(gulpif('*.css', minifyCss()))
    .pipe(gulp.dest('./dist'));
});

// Pasamos el index a /dist
gulp.task('copy', function() {
  gulp.src('./www/index.html')
    .pipe(useref())
    .pipe(gulp.dest('./dist'));
});

// Eliminamos los estilos que no se usan
gulp.task('uncss', function() {
  gulp.src('./dist/css/style.min.css')
    .pipe(uncss({
      html: ['./www/index.html']
    }))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('build', ['templates', 'compress', 'copy', 'uncss']);

// Servidor de producción
gulp.task('server-dist', function() {
  connect.server({
    root: './dist',
    hostname: '0.0.0.0',
    port: 8080,
    livereload: true,
    middleware: function(connect, opt) {
      return [ historyApiFallBack ];
    }
  });
});
