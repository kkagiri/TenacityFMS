const { series, src, dest, parallel, watch } = require("gulp");
const browsersync = require("browser-sync");
const del = require("del");
const fileinclude = require("gulp-file-include");
const imagemin = require("gulp-imagemin");
const npmdist = require("gulp-npm-dist");
const concat = require('gulp-concat')
const newer = require("gulp-newer");
const rename = require("gulp-rename");
const uglify = require("gulp-uglify");
const postcss = require('gulp-postcss');
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const replace = require('gulp-replace');
const tailwindcss = require('@tailwindcss/postcss');

const paths = {
    baseSrc: "src/",                         // source directory
    baseDist: "dist/",                       // build directory
    baseSrcAssets: "src/assets/",            // source assets directory
    baseDistAssets: "dist/assets/",          // build assets directory
};

const pluginFile = require('./plugins.config') // Import the plugins list

const clean = function (done) {
    del.sync(paths.baseDist, done());
};

const vendor = function () {
    const out = paths.baseDistAssets + "libs/";
    return src(npmdist(), { base: "./node_modules" })
        .pipe(rename(function (path) {
            path.dirname = path.dirname.replace(/\/dist/, '').replace(/\\dist/, '');
        }))
        .pipe(dest(out));
};

const plugins = function () {
    const out = paths.baseDistAssets + 'plugins/'

    pluginFile.forEach(({ name, vendorsJS, vendorCSS, vendorFonts, assets, fonts, font, media, img, webfonts }) => {
        const handleError = (label, files) => (err) => {
            const shortMsg = err.message.split('\n')[0]
            console.error(`\n${label} - ${shortMsg}`)
            throw new Error(`${label} failed`)
        }

        if (vendorsJS) {
            src(vendorsJS)
                .on('error', handleError('vendorsJS'))
                .pipe(concat('vendors.min.js'))
                .pipe(dest(paths.baseDistAssets + 'js/'))
        }

        if (vendorCSS) {
            src(vendorCSS)
                .pipe(concat("vendors.min.css"))
                .on('error', handleError('vendorCSS'))
                .pipe(replace(/url\((['"]?)(remixicon|boxicons)/g, "url($1fonts/$2"))
                .pipe(dest(paths.baseDistAssets + "css/"));
        }

        if (vendorFonts) {
            src(vendorFonts)
                .on('error', handleError('vendorFonts'))
                .pipe(dest(paths.baseDistAssets + 'css/fonts/'))
        }

        if (assets) {
            src(assets)
                .on('error', handleError('assets'))
                .pipe(dest(`${out}${name}/`))
        }

        if (img) {
            src(img)
                .on('error', handleError('img'))
                .pipe(dest(`${out}${name}/images/`))
        }

        if (media) {
            src(media)
                .on('error', handleError('media'))
                .pipe(dest(`${out}${name}/`))
        }

        if (fonts) {
            src(fonts)
                .on('error', handleError('fonts'))
                .pipe(dest(`${out}${name}/fonts/`))
        }

        if (font) {
            src(font)
                .on('error', handleError('font'))
                .pipe(dest(`${out}${name}/font/`))
        }

        if (webfonts) {
            src(webfonts)
                .on('error', handleError('webfonts'))
                .pipe(dest(`${out}${name}/webfonts/`))
        }
    })

    return Promise.resolve()
}

const html = function () {
    const srcPath = paths.baseSrc + "/";
    const out = paths.baseDist;
    return src([
        srcPath + "*.html",
        srcPath + "*.ico", // favicons
        srcPath + "*.png",
    ])
        .pipe(
            fileinclude({
                prefix: "@@",
                basepath: "@file",
                indent: true,
            })
        )
        .pipe(dest(out));
};

const data = function () {
    const outpdf = paths.baseDistAssets + 'pdf/'
    src([paths.baseSrcAssets + 'pdf/**/*']).pipe(dest(outpdf))

    const out = paths.baseDistAssets + 'data/'
    return src([paths.baseSrcAssets + 'data/**/*']).pipe(dest(out))
}

const images = function () {
    var out = paths.baseDistAssets + "images";
    return src(paths.baseSrcAssets + "images/**/*")
        .pipe(newer(out))
        .pipe(dest(out));
};

const imagesCompression = function () {
    var out = paths.baseDistAssets + "images";
    return src(paths.baseSrcAssets + "images/**/*")
        .pipe(newer(out))
        .pipe(imagemin())
        .pipe(dest(out));
};

const javascript = function () {
    const out = paths.baseDistAssets + "js/";

    // copying and minifying all other js
    return src(paths.baseSrcAssets + "js/**/*.js")
        .pipe(uglify()) // if you want to minify your custom js files then keep this line otherwise remove
        .pipe(dest(out));
};

const style = function () {
  const out = paths.baseDistAssets + "css/";

  return src(paths.baseSrcAssets + "css/app.css")
    .pipe(postcss([
      tailwindcss(),
      autoprefixer(),
    ]))
    // .pipe(dest(out))
    .pipe(rename({suffix: '.min'}))
    .pipe(postcss([cssnano({preset: ["default"]})])) // Minifies the result
    .pipe(dest(out));
};


// live browser loading
const initBrowserSync = function (done) {
    const startPath = "/index.html";
    browsersync.init({
        startPath: startPath,
        server: {
            baseDir: paths.baseDist,
            middleware: [
                function (req, res, next) {
                    req.method = "GET";
                    next();
                },
            ],
        },
    });
    done();
}

const reloadBrowserSync = function (done) {
    browsersync.reload();
    done();
}

function watchFiles() {
    watch(paths.baseSrc + "**/*.html", series([html, style], reloadBrowserSync));
    watch(paths.baseSrcAssets + "images/**/*", series(images, reloadBrowserSync));
    watch(paths.baseSrcAssets + "js/**/*", series(javascript, reloadBrowserSync));
    watch(paths.baseSrcAssets + "css/**/*.css", series(style, reloadBrowserSync));
}

// Producaton Tasks
exports.default = series(
    html,
    plugins,
    data,
    parallel(images, javascript, style),
    parallel(watchFiles, initBrowserSync)
);

// Clean Tasks
exports.clean = series(
    clean
);

// Build Tasks
exports.build = series(
    clean,
    html,
    plugins,
    data,
    images,
    // imagesCompression, // use this to compress images - takes longer!
    javascript,
    style
);