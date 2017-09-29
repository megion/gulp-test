var gulp = require('gulp');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
//var concat = require('gulp-concat');
//var uglify = require('gulp-uglify');
//var rename = require('gulp-rename');
var gulpIf = require('gulp-if');
var del = require('del');
var browserSync = require('browser-sync').create();
var eslint = require('gulp-eslint');
var cssnano = require('gulp-cssnano');
var rev = require('gulp-rev');

var paths = {
    buildDir: 'build',
    manifestDir: 'build/manifest',
    serveWatches: 'build/**/*.*',
    styles: {
        src: 'src/styles/styles.less',
        dest: 'build/styles/'
    },
    scripts: {
        src: 'src/js/**/*.js',
        dest: 'build/js/'
    },
    assets: {
        src: 'src/assets/**',
        dest: 'build'
    }
};

var isDevelopment = !process.env.NODE_ENV ||
    process.env.NODE_ENV == 'development';

gulp.task('clean', function () {
    // return its promise
    return del([ 'build' ]);
});

gulp.task('assets', function() {
    return gulp.src(paths.assets.src, {since: gulp.lastRun('assets')})
        .pipe(gulp.dest(paths.assets.dest));
});

gulp.task('styles', function () {
    return gulp.src(paths.styles.src)
        .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(less())
        //.pipe(rename({
            //basename: 'main'
            ////suffix: '.min'
        //}))
        .pipe(gulpIf(isDevelopment, sourcemaps.write('.')))
        .pipe(gulpIf(!isDevelopment, cssnano()))
        .pipe(gulpIf(!isDevelopment, rev()))
        .pipe(gulp.dest(paths.styles.dest));
        //.pipe(gulpIf(!isDevelopment, rev.manifest('css.json')))
        //.pipe(gulpIf(!isDevelopment, gulp.dest(paths.manifestDir)));
});

// check javascript files by eslint
gulp.task('lint', function() {
    return gulp.src(paths.scripts.src)
        .pipe(eslint())
        .pipe(eslint.format());
        //.pipe(eslint.failAfterError());
});

gulp.task('scripts', function (done) {
    //done();
    return gulp.src(paths.scripts.src)
        .pipe(eslint())
        .pipe(eslint.format())
    //.pipe(babel())
    //.pipe(uglify())
    //.pipe(concat('main.min.js'))
        .pipe(gulp.dest(paths.scripts.dest));
});

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('styles', 'scripts', 'assets'))
);

// Define default task that can be called by just running `gulp` from cli
gulp.task('default', gulp.series('build'));

gulp.task('watch', function() {
    gulp.watch(paths.styles.src, gulp.series('styles'));
    gulp.watch(paths.scripts.src, gulp.series('scripts'));
    gulp.watch(paths.assets.src, gulp.series('assets'));
});

gulp.task('serve', function() {
    browserSync.init({
        server: paths.buildDir
    });

    browserSync.watch(paths.serveWatches).on('change', browserSync.reload);
});

gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));

