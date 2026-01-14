const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// Load environment variables from .env file (if it exists)
// This is optional - webpack will use process.env variables or defaults
try {
  require('dotenv').config();
} catch (error) {
  // .env file is optional, continue with system environment variables
  console.log('.env file not found or invalid, using system environment variables or defaults');
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  // Define environment variables to inject into the application
  // These are replaced at build time by webpack.DefinePlugin
  const envDefaults = {
    MAIN_DOMAIN: 'example.com',
    WWW_DOMAIN: 'www.example.com',
    COOKIE_DOMAIN: '.example.com',
    API_DOMAIN: 'api.example.com',
    API_URL: '//api.example.com/api/',
    MEDIA_DOMAIN: 'media.example.com',
    CDN_DOMAIN: 'cdn.example.com',
    HLS_URL: 'https://media.example.com/vod/vod',
    MP4_URL: '//cdn.example.com/zsf/',
    RTMP_URL: 'rtmp://media.example.com/vod',
    IMAGE_OPTIMIZER_URL: '//cdn.example.com/files/images/image.php',
    SPEEDTEST_URL: '//cdn.example.com/files/bwtest.jpg',
    SUBTITLES_URL: '//beta.example.com/subs/',
    CHANNEL_URL: '//beta.example.com/channel.html',
    CACHED_INIT_URL: '//www.example.com/init.json',
    ANONYMOUS_USERNAME: 'anonymous@example.com',
    SITE_NAME: 'Vifi',
    DISQUS_SHORTNAME: 'vifi',
    FACEBOOK_APP_ID: '',
    GOOGLE_ANALYTICS_CODE: 'UA-XXXXX-1',
    SENTRY_DSN: '',
    API_KEY: '',
    WWW_URL: '//www.example.com',
    SOCIAL_FACEBOOK_URL: 'https://www.facebook.com/pages/Vifiee/385723814833754',
    SOCIAL_TWITTER_URL: 'https://twitter.com/vifi_ee',
    RSS_FEED_URL: '//www.example.com/feed',
    SUPPORT_PHONE: '+372 58 667 570',
    SUPPORT_EMAIL: 'support@example.com',
    PRIVACY_URL: '//www.example.com/privacy',
    // Flowplayer License Keys (added for Phase 1 security fixes)
    FLOWPLAYER_FP6_KEY: '',
    FLOWPLAYER_HTML5_KEY: '',
    FLOWPLAYER_FLASH_KEY: '',
    FLOWPLAYER_FP7_TOKEN: '',
    // Performance monitoring endpoint (Phase 4 enhancement)
    PERFORMANCE_ENDPOINT: '',
  };

  // Build the envVars object for DefinePlugin
  const envVars = {};
  Object.keys(envDefaults).forEach(key => {
    envVars[`process.env.${key}`] = JSON.stringify(process.env[key] || envDefaults[key]);
  });

  return {
    entry: {
      'init': './src/js/init.js',
      'settings': './src/js/settings.js',
      'views/app': './src/js/views/app.js',
    },
    output: {
      filename: isProduction ? 'js/[name].min.js' : 'js/[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    // Enable webpack caching for faster rebuilds (Phase 3 performance optimization)
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    },
    mode: argv.mode || 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              passes: 2,  // Additional pass for better compression
            },
            format: {
              comments: false,
            },
            mangle: {
              safari10: true,  // Prevents Safari 10 variable name mangling conflicts
            },
          },
          extractComments: false,
          parallel: true,  // Faster builds with parallel processing
        }),
      ],
      splitChunks: {
        cacheGroups: {
          vendors: {
            test: /[\\/]src[\\/]js[\\/]vendor[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          backbone: {
            test: /backbone|underscore/i,
            name: 'backbone',
            chunks: 'all',
            priority: 5,
          },
        },
      },
      // Additional runtime chunk for better caching
      runtimeChunk: isProduction ? 'single' : false,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin(envVars),
      new CopyPlugin({
        patterns: [
          { from: 'src/index.html', to: 'index.html' },
          { from: 'src/channel.html', to: 'channel.html' },
          { from: 'src/style', to: 'style' },
          { from: 'src/inc', to: 'inc' },
          { from: 'src/tpl', to: 'tpl' },
          { from: 'src/swf', to: 'swf' },
          { 
            from: 'src/js', 
            to: 'js', 
            globOptions: { 
              ignore: ['**/init.js', '**/settings.js', '**/views/app.js'] 
            } 
          },
          { from: 'src/favicon.ico', to: 'favicon.ico' },
          { from: 'src/favicon.png', to: 'favicon.png' },
        ],
      }),
    ],
    externals: {
      jquery: 'jQuery',
      backbone: 'Backbone',
      underscore: '_',
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        '@models': path.resolve(__dirname, 'src/js/models'),
        '@views': path.resolve(__dirname, 'src/js/views'),
        '@collections': path.resolve(__dirname, 'src/js/collections'),
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
