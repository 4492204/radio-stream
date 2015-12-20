var path = require('path');
var webpack = require('webpack');
var Promise = require('es6-promise').Promise;

module.exports = {
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/'
    },
    plugins: [
        new webpack.ProvidePlugin({
            _: "lodash",
        })
    ],
    context: __dirname,
    node: {
        __filename: true
    },
    module: {
        loaders: [
            {test: /\.less$/, loader: "style!css!less"},
            {test: /\.css/, loader: "style!css"},
            {test: /\.(png|jpg|gif)$/, loader: 'url?limit=25000'},

            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" },
        ]
    }
};
