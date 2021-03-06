const BaseSpider = require('./base')

class OschinaSpider extends BaseSpider {
  async goToEditor() {
    // 导航至首页
    await this.page.goto('https://oschina.net')
    await this.page.waitFor(5000)

    // 获取编辑器URL
    const url = await this.page.evaluate(() => {
      const aList = document.querySelectorAll('#userSidebar > a.item')
      for (let i = 0; i < aList.length; i++) {
        const a = aList[i]
        if (a.innerHTML.match('写博客')) {
          return a.getAttribute('href')
        }
      }
    })

    if (!url) throw new Error('editor url cannot be empty')

    await this.page.goto(url)
    await this.page.waitFor(5000)
  }

  async inputContent(article, editorSel) {
    const content = article.contentHtml + `<br/>` + article.linkFooterHtml + `<br/>` + article.qrFooterHtml
    const iframeWindow = document.querySelector('.cke_wysiwyg_frame').contentWindow
    const el = iframeWindow.document.querySelector(editorSel.content)
    el.focus()
    iframeWindow.document.execCommand('delete', false)
    iframeWindow.document.execCommand('insertHTML', false, content)
    document.querySelector('textarea[name="body"]').value = content
  }

  async inputFooter(article, editorSel) {
    // do nothing
  }

  async afterInputEditor() {
    await this.page.click('#writeArticleWrapper > div > div > form > div.inline.fields.footer-fields > div.required.field.set-bottom.field-groups > div')
    await this.page.waitFor(1000)

    await this.page.evaluate(task => {
      document.querySelectorAll('#writeArticleWrapper > div > div > form > div.inline.fields.footer-fields > div.required.field.set-bottom.field-groups > div > div.menu.transition .item')
        .forEach((item) => {
          if (item.innerText === task.category) {
            item.click();
          }
        })
    }, this.task)
    await this.page.waitFor(1000)
  }

  async publish() {
    // 发布文章
    await this.page.evaluate(editorSel => {
      const el = document.querySelector(editorSel.publish)
      el.click()
    }, this.editorSel)
    await this.page.waitFor(5000)

    // 后续处理
    await this.afterPublish()
  }

  async afterPublish() {
    const url = this.page.url()
    if (!url.match(/\/blog\/\d+/)) {
      return
    }
    this.task.url = url
    this.task.updateTs = new Date()
    await this.task.save()
  }

  async fetchStats() {
    if (!this.task.url) return
    await this.page.goto(this.task.url, { timeout: 60000 })
    await this.page.waitFor(5000)

    const stats = await this.page.evaluate(() => {
      const text = document.querySelector('body').innerText
      const mRead = text.match(/阅读数 (\d+)/)
      const mLike = text.match(/(\d+) 赞/)
      const mComment = text.match(/(\d+) 评论/)
      const readNum = mRead ? Number(mRead[1]) : 0
      const likeNum = mLike ? Number(mLike[1]) : 0
      const commentNum = mComment ? Number(mComment[1]) : 0
      return {
        readNum,
        likeNum,
        commentNum
      }
    })
    this.task.readNum = stats.readNum
    this.task.likeNum = stats.likeNum
    this.task.commentNum = stats.commentNum
    await this.task.save()
    await this.page.waitFor(3000)
  }
}

module.exports = OschinaSpider
