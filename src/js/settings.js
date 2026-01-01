var App = {};

App.Settings = {
    // properties
        version: '2020-05.2',
        debug: false,
        language: 'est',
        sitename: process.env.SITE_NAME || 'Vifi',
        skin: 'vifi',
        anonymous_username: process.env.ANONYMOUS_USERNAME || 'anonymous@example.com',
        sortingEnabled: true,
        loginEnabled: true,
        sentry_enabled: true,
	    sentry_dsn: process.env.SENTRY_DSN || '',
        google_analytics_enabled: true,
        google_analytics_code: process.env.GOOGLE_ANALYTICS_CODE || 'UA-XXXXX-1',
        rt_api_key: '',
        facebook_app_id: process.env.FACEBOOK_APP_ID || '',
        commentsEnabled: true,
        disqus_shortname: process.env.DISQUS_SHORTNAME || 'vifi',
        /** API Settings **/
        Api: {
            url: process.env.API_URL || '//api.example.com/api/',
            key: process.env.API_KEY || ''
        },
        Cookies: {
            cookie_name: 'vifi_session',
            cookie_options: {
                path : '/', 
                domain: process.env.COOKIE_DOMAIN || '.example.com',
                secure: true,  // Only send over HTTPS
                sameSite: 'Lax'  // CSRF protection
            },
            purchase_cookie_name: 'film',
        },
        /** Image settings **/

        Images: {
            image_optimizer_enabled: true,
            image_optimizer_url: process.env.IMAGE_OPTIMIZER_URL || '//cdn.example.com/files/images/image.php',
            image_optimizer_default_preset: 'w780',
        },
        Featured: {
            featured_slides_limit: 8,
            featured_slides_randomize: true,
            featured_slides_autoplay_interval : 6000
        },

        /** Payment Settings **/

        Payment: {
            'default_method' : 'code',
            'mobile' : {'autostart' : false },
            'allowFreeProducts' : true
        },
        /** Player Settings **/

        Player:  {
            defaultMediaPlayer: 'fp7',
            flowplayer_fp6_key: '$202296466927761',
            flowplayer_flash_key:  '#$05466e2f492e2ca07a3',
            flowplayer_html5_key: '$202296466927761',
            flowplayer_fp7_token: 'eyJraWQiOiJMNE5JZWNidlR5T0MiLCJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJjIjoie1wiYWNsXCI6NCxcImlkXCI6XCJMNE5JZWNidlR5T0NcIn0iLCJpc3MiOiJGbG93cGxheWVyIn0.Ji_KqLLl5wJm28h1wdv_Lb1QSC-_9NyA7mIZS4HHIlIr6V29c3UYYkFsbo2jZQON35f_PC4xHk7hqLIGwMnJIw',
            hls_url: process.env.HLS_URL || 'https://media.example.com/vod/vod',
            mp4_url: process.env.MP4_URL || '//cdn.example.com/zsf/',
            rtmp_url: process.env.RTMP_URL || 'rtmp://media.example.com/vod',
            speedtest_url: process.env.SPEEDTEST_URL || '//cdn.example.com/files/bwtest.jpg',
            subtitles_url: process.env.SUBTITLES_URL || '//beta.example.com/subs/',
            enable_legacy_subtitles: false,
            convert_srt_to_vtt: true
        },

        /** Search Settings **/

        Search: {
            initial_film_amount: 300,

            default_query_params: {
                  totalPages: null,
                  totalRecords: null,
                  sortKey: 'sort',
                  limit: 400
            },

            // Initial pagination states
            // You can remap the query parameters from `state` keys from
            // the default to those your server supports

            default_search_state: {
                q:'',
                genres: undefined,
                periods: undefined,
                durations: undefined
            },

            default_pagination_state: {
                pageSize: 12,
                sortKey: 'updated_at',
                order: 0,
            }
        },
        /** Social Media & External Links **/
        
        Social: {
            facebook_url: process.env.SOCIAL_FACEBOOK_URL || 'https://www.facebook.com/pages/Vifiee/385723814833754',
            twitter_url: process.env.SOCIAL_TWITTER_URL || 'https://twitter.com/vifi_ee',
            rss_feed_url: process.env.RSS_FEED_URL || '//www.example.com/feed',
        },
        
        /** Support & Contact Information **/
        
        Support: {
            phone: process.env.SUPPORT_PHONE || '+372 58 667 570',
            email: process.env.SUPPORT_EMAIL || 'support@example.com',
            privacy_url: process.env.PRIVACY_URL || '//www.example.com/privacy',
        },
        page_change_callback: function(title, parameters) {
        },
}

App.Translations = {
        'est' : {
            'No subtitles': 'Subtiitreid pole',
            'Eesti' : 'Eesti',
            'Not Found' : 'Läinud',
            'This page is no longer available' : 'Seda lehte pole (enam) olemas',
            'Go to home page' : 'Tagasi esilehele',
            'English' : 'Inglise',
            'Clear' : 'Puhasta',
            'Change password': 'Vaheta parool',
            'Create password': 'Loo parool',
            'Passwords do not match' : 'Paroolid pole samad',
            'No results' : 'Antud otsinguga tulemusi ei leitud. Täpsustage palun otsingut ja kontrollige üle ka teised filtrid (kategooria, kestvus, aasta)',
            'No purchases' : 'Ei ostusid',
            'My purchases' : 'Minu filmid',
            'No description available' : 'Kirjeldus puudub',
            'You have registered successfully' : 'Registreerimine õnnestus',
            'Fill all the fields' : 'Täida kõik väljad',
            'Thank you' : 'Tänud!',
            'No' : 'Ei',
            'Expired' : 'Aegunud',
            'Yes' : 'Jah',
            'All Genres' : 'Kõik genred',
            'Hours' : 'Tundi',
            'd' : 'pv',
            'hr' : ' tundi',
            'Days' : 'Päeva',
            'Weeks' : 'Nädala',
            'Months' : 'Kuud',
            'Choose payment method' : 'Vali makseviis',
            'Watch' : 'Vaata',
            'Watch film' : 'Vaata filmi',
            'Continue watching' : 'Vaata edasi',
            'Invalid code' : 'Vale kood',
            'Enter code': 'Sisesta piletikood',
            'Try again' : 'Proovi uuesti',
            'Disabled' : 'Väljas',
            'Subtitles' : 'Subtiitrid',
            'Quality' : 'Kvaliteet',
            'Close' : 'Sulge',
            'No Subtitles' : 'Subtiitreid pole',
            'Invalid code, please verify and try again.': 'Vale kood! Kontrolli õigust ja proovi uuesti.',
            'Ticket code accepted! The code is valid until': 'Piletikood aktsepteeritud! Kood kehtib kuni',
            'Content is not available. It may have been removed or the address is invalid.' : 'Seda filmi pole saadaval. See võib olla maha võetud, või aadress on vale.',
            'Timed out' : 'Helistamiseks mõeldud aeg on läbi ja makset ei toimunud. Kui soovid siiski piletit tellida, vajuta allolevat nuppu.',
            'Invalid merchant' : 'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
            'Transaction cannot be completed.': 'Makse ei ole lubatud. M-makse lubamiseks palun võta ühendust mobiilioperaatori klienditoega',
            'Requested function code not supported':'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
            'Insufficient funds':'Kontol pole piisavalt vahendeid või on lubatud limiit ületatud. Palun võta ühendust mobiilioperaatori klienditoega',
            'Transaction is not permitted':'Makse ei ole lubatud. M-makse lubamiseks palun võta ühendust mobiilioperaatori klienditoega.',
            'Exceeds withdrawal amount limit':'Summa ületab lubatud päevalimiidi',
            'Accepted':'Makse õnnestus!',
            'Invalid transaction':'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
            'Format error':'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
            'System malfunction':'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
            'Time out waiting for response':'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
            'Duplicate transaction':'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
            'Original transaction missing' :'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
            'Transaction in progress' :'Makse ei õnnestunud, palun proovi uuesti. Probleemi kordumisel võta ühendust teenusepakkuja klienditoega',
        },
        'en' : {
            'eesti' : 'Estonian',
            'english' : 'English',
            'No results' : 'Ei tulemusi',
            'Timed out' : 'Timed out'
        }
}
