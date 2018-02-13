var gulp = require('gulp');
var grename = require('gulp-rename');
var gimageresize = require('gulp-image-resize');

var paths = {
    scripts: {
        src: 'scripts/*.js',
        dest: 'task'
    },
    icon: {
        src: 'images/extension-icon.png',
        dest: 'task'
    }
};

gulp.task('copyScripts', function () {
    return gulp.src(paths.scripts.src)
        .pipe(gulp.dest(paths.scripts.dest));
});

gulp.task('copyIcon', function () {
    return gulp.src(paths.icon.src)
        .pipe(gimageresize({
            width: 32,
            height: 32
        }))
        .pipe(grename('icon.png'))
        .pipe(gulp.dest(paths.icon.dest));
});

gulp.task('default', ['copyScripts', 'copyIcon']);