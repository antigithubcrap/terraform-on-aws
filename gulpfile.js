var gulp = require('gulp');

var paths = {
    scripts: {
        src: 'node_modules',
        dest: 'task'
    },
    customScripts: {
        src: 'scripts/*.js',
        dest: 'task'
    }
};

gulp.task('copyCustomScripts', function () {
    return gulp.src(paths.customScripts.src)
        .pipe(gulp.dest(paths.customScripts.dest));
});

gulp.task('default', ['copyCustomScripts']);