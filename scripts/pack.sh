#!/bin/sh
 
routes=("src/js/settings.js" "src/js/router.js" "src/js/models/models.js" "src/js/models/platform.js" "src/js/models/utils.js" "src/js/models/user.js" "src/js/models/session.js" "src/js/models/player.js" "src/js/models/playlist.js" "src/js/models/purchase.js" "src/js/collections/collections.js" "src/js/models/forms.js" "src/js/views/app.js" "src/js/views/films.js" "src/js/views/filterbar.js" "src/js/views/detailpage.js" "src/js/views/purchase.js" "src/js/views/player.js" "src/js/views/user.js" "src/js/views/facebook.js" "src/js/views/browser.js" "src/js/init.js")

FILES=$(printf " %s " "${routes[@]}")
uglifyjs $FILES >src/js/packed.js

