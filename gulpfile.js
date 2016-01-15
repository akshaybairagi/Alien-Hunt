var concat = require('gulp-concat');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('libraryJS', function() {
  return gulp.src([ './library/sound.js',
                    './library/utilities.js',
                    './library/display.js',
                    './library/shapes.js',
                    './library/interactive.js',
                    './library/collision.js',
                    './library/particles.js',
                    './library/tiling.js',
                    './library/tween.js',
                    './library/engine.js'
                  ])
    .pipe(concat('engine.js'))
    .pipe(gulp.dest('./bin/'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./bin/'))
});

gulp.task('gameJS', function() {
  return gulp.src([ './js/effects.js',
                    './js/setup.js',
                    './js/play.js'
                  ])
    .pipe(concat('game.js'))
    .pipe(gulp.dest('./bin/'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./bin/'))
});

gulp.task('watchers', function(){
  gulp.watch('js/**/*.js', ['js']);
});

gulp.task('default', ['libraryJS', 'gameJS', 'watchers']);
