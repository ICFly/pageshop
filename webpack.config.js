const path = require('path')
const fs = require('fs')

const webpack = require('webpack')
const WebpackShellPlugin = require('webpack-shell-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const force_stringify = require('./local_modules/force_stringify')
const Mock = require('mockjs')

const is_production = process.env.NODE_ENV === 'production';

// Set pages config by --page=index[,page1,page2]
// Default: page=index

const pages_config = require('./pages_config.json');
const current_pages = process.env.npm_config_page==='.all'
  ? fs.readdirSync('./src/pages')
  : (process.env.npm_config_page||'index').split(',');

const page_default_config = {      
    path: './',
    inject: true,
    template:  "!!ejs-compiled-loader!./src/templates/index.html",
    title: 'pageshop',
    is_production: is_production,
    flexible: true,
    debug: !is_production
}

const current_pages_config = {
  entry: (()=>{
    let config = {};
    current_pages.forEach((key)=>(config[key] = `./src/pages/${ key }/main.js`))
    return config;
  })(),
  HtmlWebpackPlugins: current_pages.map(
    (key) => new HtmlWebpackPlugin(
      Object.assign(
        {
          filename: `${ key }.html`,
          chunks: [key]
        },
        page_default_config,
        pages_config[key]
      )
    )
  )
};

module.exports = {
    entry: current_pages_config.entry,
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/',
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        modules: ['node_modules', 'components']
    },
    plugins: [].concat(current_pages_config.HtmlWebpackPlugins),
    devServer: {
        host: '0.0.0.0',
        port: 8888,
        historyApiFallback: true,
        noInfo: true,
        proxy: {
            '/api': {
                bypass: function(req, res, proxyOptions) {
                    fs.readFile(`./src/mockjson${ req.path }.json`, 'utf8', (err, data) => {
                        var content = err
                            ? force_stringify(Object.assign({error: err}, req), true, 2)
                            : data;

                        if (!err) {
                            try{
                                content = JSON.stringify(Mock.mock(JSON.parse(content)))
                            }catch(e){
                                content = force_stringify(Object.assign({error: e}, req), true, 2)
                            }
                        }

                        res.writeHead(200, { 'Content-Type': 'text/json' });
                        res.end(content);
                    });
                }
            }
        }
    }
}

if (is_production) {
  module.exports.output = Object.assign(module.exports.output,{
    publicPath: './',
    filename: '[name].[hash].js'
  });

  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new WebpackShellPlugin({
        onBuildStart: `
            echo "\n\n ----Webpack Build Start---- \n\n";
            rm -rf dist/*;
        `,
        onBuildEnd: [`
                echo "\n\n ----Webpack Build End---- \n\n";
            `].concat(current_pages.map((page_name)=>`
                node local_modules/htmlone.js dist/${ page_name }.html | html-minifier -c local_modules/html-minifier.config.json > dist/${ page_name }.min.html;
                sleep .1;
                mv dist/${ page_name }.min.html dist/${ page_name }.html;
                rm dist/${ page_name }.*.js;
                # Do anything you want with shell in there
            `))
        })
    ])
}