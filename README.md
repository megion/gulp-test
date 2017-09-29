

Old version
    npm -v
    4.4.4

    node -v
    v0.10.36

Upgrade to new version. Install stable node and npm version
    su
    # n stable
    # or n 6.11.2 # for install LTS
    # npm install -g npm@latest
    # exit


    $ npm cache clean -f

    npm -v
    5.3.0

    node -v
    v8.2.1

Upgrade gulp
    su
    # npm uninstall -g gulp-cli
    # npm install -g gulpjs/gulp-cli
    # exit

    $ npm install gulpjs/gulp.git#4.0 --save-dev

Run tasks in production mode
    $ NODE_ENV=production gulp

Add dev package
    $ npm i -D browser-sync

