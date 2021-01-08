const BaseSpider = require('./base')
const constants = require('../constants')

class CnblogsSpider extends BaseSpider {

  // async inputContent(article, editorSel) {
  //   const footerContent = ``
  //   const content = article.contentHtml + footerContent;
  //   const iframeWindow = document.querySelector('#Editor_Edit_EditorBody_ifr').contentWindow
  //   const el = iframeWindow.document.querySelector(editorSel.content)
  //   el.focus()
  //   iframeWindow.document.execCommand('delete', false)
  //   iframeWindow.document.execCommand('insertHTML', false, content)
  // }

  async inputFooter(article, editorSel) {
    // do nothing
  }

  async afterInputEditor() {
    // 选择 个人分类
    await this.page.evaluate(task => {
      document.querySelectorAll('cnb-collapse-panel[name="个人分类"] > div.ng-trigger-openClosePanel .item__text')
        .forEach(item => {
          if (item.innerText === task.category) {
            item.previousElementSibling.click()
          }
        })
    }, this.task)
    await this.page.waitFor(1000)

    // 选择 发布至首页候选区
    await this.page.click('#site-publish-candidate')
    await this.page.waitFor(1000)

    // 选择 发布至博客园首页
    await this.page.click('#site-publish-site-home')
    await this.page.waitFor(1000)

    // 输入标签
    if (this.task.tag) {
      await this.page.evaluate(task => {
        task.tag.split(',').forEach(tag => {
          document.querySelector('#tags > ng-select > div > div > div.ng-input > input[type=text]').focus()
          document.execCommand('insertText', false, tag)
          document.querySelector('body > ng-dropdown-panel > div > div:nth-child(2) > div:nth-child(1)').click()
        })
      }, this.task)
      await this.page.waitFor(1000)
    }
  }

  async afterPublish() {
    this.task.url = await this.page.evaluate(() => {
      return document.querySelector('.link-post-title')
        .getAttribute('href')
    })
    console.log('博客园文章地址：' + this.task.url)
    if (!this.task.url) return
    // 抓取的 url 是 `//{domain}/{path}` 形式，需要手动加上协议
    this.task.url = 'https:' + this.task.url
    this.task.updateTs = new Date()
    this.task.status = constants.status.FINISHED
    await this.task.save()
  }

  async fetchStats() {
    if (!this.task.url) return
    await this.page.goto(this.task.url, { timeout: 60000 })
    await this.page.waitFor(5000)

    const stats = await this.page.evaluate(() => {
      const text = document.querySelector('body').innerText
      const mRead = text.match(/阅读\((\d+)\)/)
      const mLike = document.querySelector('#bury_count').innerText
      const mComment = text.match(/评论\((\d+)\)/)
      const readNum = mRead ? Number(mRead[1]) : 0
      const likeNum = Number(mLike)
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

module.exports = CnblogsSpider
