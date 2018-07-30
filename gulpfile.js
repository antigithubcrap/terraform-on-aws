var gulp = require('gulp');
var grename = require('gulp-rename');
var gimageresize = require('gulp-image-resize');

var paths = {
    scripts: {
        srcApply: 'scripts/terraform-apply/*.js',
        destApply: 'tasks/terraform-apply',
        srcDestroy: 'scripts/terraform-destroy/*.js',
        destDestroy: 'tasks/terraform-destroy',
        srcTools: 'scripts/terraform-tools/*.js',
        destTools: 'tasks/terraform-tools'
    },
    icon: {
        src: 'images/extension-icon.png',
        destApply: 'tasks/terraform-apply',
        destDestroy: 'tasks/terraform-destroy',
        destTools: 'tasks/terraform-tools'
    }
};

gulp.task('copyApplyScripts', function () {
    return gulp.src(paths.scripts.srcApply)
        .pipe(gulp.dest(paths.scripts.destApply));
        
});

gulp.task('copyDestroyScripts', function () {
    return gulp.src(paths.scripts.srcDestroy)
        .pipe(gulp.dest(paths.scripts.destDestroy));
});

gulp.task('copyToolsScripts', function () {
    return gulp.src(paths.scripts.srcTools)
        .pipe(gulp.dest(paths.scripts.destTools));
});

gulp.task('copyIcon', function () {
    return gulp.src(paths.icon.src)
        .pipe(gimageresize({
            width: 32,
            height: 32
        }))
        .pipe(grename('icon.png'))
        .pipe(gulp.dest(paths.icon.destApply))
        .pipe(gulp.dest(paths.icon.destDestroy))
        .pipe(gulp.dest(paths.icon.destTools));
});

gulp.task('default', ['copyApplyScripts', 'copyDestroyScripts', 'copyToolsScripts', 'copyIcon']);