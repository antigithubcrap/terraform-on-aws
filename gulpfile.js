var gulp = require('gulp');

var paths = {
    scripts: {
        src: 'scripts/*.js',
        dest: 'task'
    }
};

gulp.task('copyScripts', function () {
    return gulp.src(paths.scripts.src)
        .pipe(gulp.dest(paths.scripts.dest));
});

gulp.task('default', ['copyScripts']);