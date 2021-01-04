const constants = require('../constants')
const BaseSpider = require('./base')

class JianshuSpider extends BaseSpider {
  /**
   * 输入编辑器
   */
  async inputEditor() {
    // 输入标题
    await this.page.evaluate(this.inputTitle, this.article, this.editorSel, this.task)
    await this.page.waitFor(3000)

    // 按tab键切换
    await this.page.keyboard.press('Tab')
    await this.page.waitFor(1000)

    // 输入内容
    await this.page.evaluate(this.inputContent, this.article, this.editorSel)
    await this.page.waitFor(3000)

    // 输入脚注
    await this.page.evaluate(this.inputFooter, this.article, this.editorSel)

    // 敲入空值防止内容为空
    const elContent = await this.page.$(this.editorSel.content)
    await elContent.type(' ')
    await this.page.waitFor(3000)

    // 后续处理
    await this.afterInputEditor()
  }

  /**
   * 输入文章内容
   */
  async inputContent(article, editorSel) {
    // 简书不允许链接和二维码
    const content = article.content
    document.execCommand('insertText', false, content)
  }

  async inputFooter(article, editorSel) {
    // do nothing
  }

  async afterGoToEditor() {
    await this.page.evaluate(() => {
      document.querySelectorAll('span')
        .forEach(el => {
          if (el.textContent.trim() === '新建文章') {
            el.click()
          }
        })
    })
    await this.page.waitFor(5000)
  }

  async afterInputEditor() {
  }

  async afterPublish() {
    this.task.url = await this.page.evaluate(() => {
      const aList = document.querySelectorAll('a');
      for (let i = 0; i < aList.length; i++) {
        const a = aList[i]
        const href = a.getAttribute('href')
        if (href && href.match(/\/p\/\w+/)) {
          return href
        }
      }
    })
    if (!this.task.url) return
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
      const mRead = text.match(/阅读 ([,\d]+)/)
      const mLike = text.match(/(\d+)人点赞/)
      const mComment = text.match(/全部评论\n(\d+)/)
      const readNum = mRead ? Number(mRead[1].replace(/,/g, '')) : 0
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

module.exports = JianshuSpider
