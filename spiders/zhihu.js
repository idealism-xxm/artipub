const fs = require('fs')
const path = require('path')
const BaseSpider = require('./base')
const constants = require('../constants')

class ZhihuSpider extends BaseSpider {
  async afterGoToEditor() {
    // 创建tmp临时文件夹
    const dirPath = path.resolve(path.join(__dirname, '..', 'tmp'))
    if (!fs.existsSync(dirPath)) {
      await fs.mkdirSync(dirPath)
    }

    // 内容
    const content = this.article.content + this.article.linkFooter

    // 写入临时markdown文件
    const mdPath = path.join(dirPath, `${this.article._id.toString()}.md`)
    await fs.writeFileSync(mdPath, content)

    // 点击更多
    await this.page.click('#Popover3-toggle')
    await this.page.waitFor(1000)

    // 点击导入文档
    await this.page.click('.Editable-toolbarMenuItem:nth-child(1)')
    await this.page.waitFor(1000)

    // 上传markdown文件
    const handle = await this.page.$('input[accept=".docx,.doc,.markdown,.mdown,.mkdn,.md"]')
    await handle.uploadFile(mdPath)
    await this.page.waitFor(5000)

    // 删除临时markdown文件
    await fs.unlinkSync(mdPath)
  }

  async inputContent(article, editorSel) {
    // do nothing
  }

  async inputFooter(article, editorSel) {
    // do nothing
  }

  async afterInputEditor() {
    // 点击发布文章
    await this.page.evaluate(() => {
      const el = document.querySelector('.PublishPanel-triggerButton')
      el.click()
    })
    await this.page.waitFor(5000)

    // 先删除原有标签
    await this.page.evaluate(() => {
      document.querySelectorAll('.PublishPanel-removeTag').forEach(el => el.click())
    })
    await this.page.waitFor(1000)

    // 选择标签
    const tags = this.task.tag.split(',')
    for (const tag of tags) {
      const elTagInput = await this.page.$('.PublishPanel-searchInput')
      await elTagInput.type(tag)
      await this.page.waitFor(3000)
      await this.page.evaluate(() => {
        const el = document.querySelector('.PublishPanel-suggest > li:nth-child(1)')
        if (el) {
          el.click()
        }
      })
      await this.page.waitFor(1000)
    }

    // 点击下一步
    await this.page.evaluate(() => {
      document.querySelector('.PublishPanel-stepOneButton > button').click()
    })
    await this.page.waitFor(2000)
  }

  async publish() {
    // 发布文章
    try {
      await this.page.evaluate(() => {
        const el = document.querySelector('.PublishPanel-stepTwoButton')
        el.click()
      })
    } catch (e) {
      // do nothing
    }
    await this.page.waitFor(5000)

    // 后续处理
    await this.afterPublish()
  }

  async afterPublish() {
    this.task.url = this.page.url()
    console.log('知乎文章地址：' + this.task.url)
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
      const mComment = text.match(/(\d+) 条评论/)
      const likeNum = Number(document.querySelector('.VoteButton--up').getAttribute('aria-label').substr(2).trim())
      // 暂时看不到阅读数，默认使用赞数
      const readNum = likeNum
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

module.exports = ZhihuSpider
