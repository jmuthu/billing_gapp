const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

gulp.task('build-es6', () =>
    gulp.src([
        'experimental/**/*/babelHelpers.js',
        'experimental/**/model/*.js',
        'experimental/**/spreadSheet/*.js',
        'experimental/**/*/BillingService.js',
        'experimental/**/*/BillingServiceTest.js',
    ])
        .pipe(babel({
            presets: ['es2015'],
            ignore: ['babelHelpers.js'],
            plugins: ['remove-comments', 'external-helpers', 'transform-remove-strict-mode'],
            generatorOpts: { quotes: 'single' }
        }))
        .pipe(concat('billing_gapp_es6.js'))
        .pipe(gulp.dest('./built'))
);

gulp.task('build-es3', () =>
    gulp.src('src/*.js')
        .pipe(babel({
            presets: ['es2015'],
            plugins: ['remove-comments', 'transform-remove-strict-mode'],
            generatorOpts: { quotes: 'single' }
        }))
        .pipe(concat('billing_gapp_es3.js'))
        .pipe(gulp.dest('./built'))
);
