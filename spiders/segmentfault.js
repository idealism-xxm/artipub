const BaseSpider = require('./base')
const constants = require('../constants')

class SegmentfaultSpider extends BaseSpider {
  async spiderInputContent() {
    const content = this.article.content + this.article.linkFooter + this.article.qrFooter
    await this.page.mouse.click(200, 400)
    await this.page.evaluate((content) => {
      document.execCommand('insertText', false, content)
    }, content)
  }

  async inputFooter(article, editorSel) {
    // do nothing
  }

  async afterInputEditor() {
    // 点击添加标签
    await this.page.evaluate(() => {
      document.querySelector('button.btn-Secondary').click()
    })
    await this.page.waitFor(1000)

    // 输入并选择标签
    const tags = this.task.tag.split(',')
    const elTagInput = await this.page.$('#searchTag')
    for (const tag of tags) {
      // 清除已有内容
      await this.page.evaluate(() => {
        const el = document.querySelector('#searchTag')
        el.select()
        document.execCommand('delete', false)
      })
      await this.page.waitFor(1000)

      // 输入标签
      await elTagInput.type(tag)
      await this.page.waitFor(3000)
      await this.page.evaluate(() => {
        const el = document.querySelector('#tagSearchResult > a:nth-child(1)')
        if (el) {
          el.click()
        }
      })
      await this.page.waitFor(3000)
    }

    // 点击发布文章
    await this.page.click('button.btn-primary')
    await this.page.waitFor(1000)

    // 勾选 注明版权
    await this.page.click('#license')
    await this.page.waitFor(1000)
  }

  async afterPublish() {
    this.task.url = this.page.url()
    this.task.updateTs = new Date()
    this.task.status = constants.status.FINISHED
    if (this.task.url.includes('https://segmentfault.com/a/')) {
      await this.task.save()
    }
  }

  async fetchStats() {
    if (!this.task.url) return
    await this.page.goto(this.task.url, { timeout: 60000 })
    await this.page.waitFor(5000)

    const stats = await this.page.evaluate(() => {
      const text = document.querySelector('body').innerText
      const mComment = text.match(/(\d+) 条评论/)
      const mRead = text.match(/阅读 (\d+)/)
      const readNum = mRead ? Number(mRead[1]) : 0
      const likeNum = Number(document.querySelector('.mainLikeNum').innerText)
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

module.exports = SegmentfaultSpider
