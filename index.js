'use strict';
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var reg = /<\!--\W*{\W*inject-assets\W*}\W*-->/ig;

var injectTpl = '<!--InjectAssets--  <%= assets %>    --InjectAssets-->';

function noon(){}


function HtmlWebpackInlineAssetsPlugin (options) {
    options = options || {};
    this.filter = options.filter || /\.map$/;
    this.presets = options.presets || [];
}

HtmlWebpackInlineAssetsPlugin.prototype.apply = function (compiler) {
    var self = this;
    if (compiler.hooks) {
        // webpack 4 support
        compiler.hooks.compilation.tap('HtmlWebpackInlineAssets', function (compilation) {
            compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync('HtmlWebpackInlineAssets', function (htmlPluginData, callback) {
                // console.log('htmlPluginData: \n\n\n\n', htmlPluginData, '\n\n\n\n');
                self.inject(compilation, htmlPluginData, callback);
            });
        });
    }
};

HtmlWebpackInlineAssetsPlugin.prototype.inject = function(compilation, htmlPluginData, callback){
    var options = htmlPluginData.plugin.options;
    var publicPath = htmlPluginData.assets.publicPath;
    var assetsList = Object.keys(compilation.assets);
    // console.log(assetsList, htmlPluginData.assets.js, htmlPluginData.assets.css);
    var finalAss = assetsList.map((v, i) => {
        if ( this.filter ) {
            if(!this.filter.test(v)) {
                return path.join(publicPath, v);
            }
        } else {
            return path.join(publicPath, v);
        }
    });

    finalAss = finalAss.filter((v) => {
        if( v ) {
            return v;
        }
    });

    // 加入第三方插入的 css js 文件

    htmlPluginData.assets.js.forEach(function(v, i){
        if( v && finalAss.indexOf(v) < 0){
            finalAss.push(v);
        }
    });

    htmlPluginData.assets.css.forEach(function(v, i){
        if( v && finalAss.indexOf(v) < 0){
            finalAss.push(v);
        }
    });

    this.presets.forEach((v, i) => {
        if(this.filter.test(v)) {
            return;
        }
        if( v && finalAss.indexOf(v) < 0){
            finalAss.push(v);
        }
    });

    // console.log('assetsList:', finalAss);

    var newHtml = ejs.render(injectTpl, { assets: finalAss.join(';')});
    // console.log(newHtml);
    // console.log('\n\n\n HtmlWebpackPreprocessPlugin: \n\n\n',reg.test(htmlPluginData.html), htmlPluginData);
    if(reg.test(htmlPluginData.html)){
        htmlPluginData.html = htmlPluginData.html.replace(reg, newHtml);
    } else {
        htmlPluginData.html = htmlPluginData.html + newHtml;
    }
    
    callback(null);
    // callback(null);
};

module.exports = HtmlWebpackInlineAssetsPlugin;