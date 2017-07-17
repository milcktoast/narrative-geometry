PATH=$(npm bin):$PATH
rm build/bundle-app.js
browserify src/index.js | uglifyjs --compress --mangle > build/bundle-app.js
terminal-notifier -title "Word Vectors" -message "Build Complete"
