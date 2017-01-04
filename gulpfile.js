const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

const rollup = require('rollup').rollup;
const rollupBabel = require('rollup-plugin-babel');

gulp.task('build-es6', function () {
    return rollup({
        entry: 'experimental/main/js/com/github/jmuthu/billing/application/BillingService.js',
        plugins: [
            rollupBabel({
                exclude: 'node_modules/**',
                babelrc: false,
                presets: ['es2015-rollup'],
                plugins: ['remove-comments', 'transform-flow-strip-types'],
                generatorOpts: { quotes: 'single' }
            })
        ]
    }).then(function (bundle) {
        return bundle.write({
            dest: 'built/billing_gapp_es6.js'
        });
    });

});

gulp.task('build-es6-old', () =>
    gulp.src([
        'experimental/**/*/babelHelpers.js',
        'experimental/**/shared/*.js',
        'experimental/**/model/*.js',
        'experimental/**/spreadSheet/*.js',
        'experimental/**/*/BillingService.js',
        'experimental/**/*/BillingServiceTest.js',
    ])
        .pipe(babel({
            presets: [['es2015', {
                'modules': false
            }]],
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
