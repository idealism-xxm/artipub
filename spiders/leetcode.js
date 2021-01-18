const BaseSpider = require('./base')
const constants = require('../constants')

class LeetcodeSpider extends BaseSpider {
  async inputContent(article, editorSel) {
    const content = article.content
    monaco.editor.getModels()[0].setValue(content)
  }

  async afterInputEditor() {
    // 选择标签
    const tags = this.task.tag.split(',')
    for (const tag of tags) {
      await this.page.click('#lc-home > div > div > div:nth-child(2) > div:nth-child(1)')
      const elTagInput = await this.page.$('input[placeholder="搜索标签"]')
      await elTagInput.type(tag)
      await this.page.waitFor(3000)
      await this.page.evaluate(() => {
        const el = document.querySelector('div[role="listbox"] > div:nth-child(1)')
        if (el) {
          if (el.innerText.includes('添加')) {
            el.click()
            // 等待页面元素变更完成再点击
            setTimeout(function () {
              document.querySelector('div[role="listbox"] > div:nth-child(1)').click()
            }, 500)
          } else {
            el.click()
          }
        }
        // 清空输入框
        document.querySelector('input[placeholder="搜索标签"]').select()
        document.execCommand('delete', false)
      })
      await this.page.waitFor(1000)
    }
  }

  async afterPublish() {
    this.task.url = this.page.url()
    console.log('力扣文章地址：' + this.task.url)
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
      const mRead = text.match(/(\d+) 阅读/)
      const mComment = text.match(/(\d+)\n条评论/)
      const readNum = mRead ? Number(mRead[1]) : 1
      const commentNum = mComment ? Number(mComment[1]) : 0
      let likeNum = 0
      document.querySelectorAll('span').forEach(span => {
        if (span.innerText !== '收藏') {
          return
        }
        // 找到收藏节点的前一个节点
        likeNum = Number(span.parentElement.parentElement.previousSibling.innerText)
      })
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

module.exports = LeetcodeSpider
