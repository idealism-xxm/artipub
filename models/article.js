const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
    title: String,
    content: String,
    contentHtml: String,
    // 链接页脚（用于引流，部分平台不会允许此内容，需要屏蔽）
    linkFooter: String,
    linkFooterHtml: String,
    // 二维码页脚（用于引流，部分平台不会允许此内容，需要屏蔽）
    qrFooter: String,
    qrFooterHtml: String,
    platformIds: Array,
    createTs: Date,
    updateTs: Date,
    readNum: Number,
    likeNum: Number,
    commentNum: Number,
})

const Article = mongoose.model('articles', articleSchema)

module.exports = Article
