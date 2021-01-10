const fs = require('fs')
const path = require('path')
const constants = require('../constants');
const BaseSpider = require('./base');

class CsdnSpider extends BaseSpider {


  async afterGoToEditor() {
    // 创建tmp临时文件夹
    const dirPath = path.resolve(path.join(__dirname, '..', 'tmp'))
    if (!fs.existsSync(dirPath)) {
      await fs.mkdirSync(dirPath)
    }

    // 内容
    const content = this.article.content + this.article.linkFooter + this.article.qrFooter

    // 写入临时markdown文件
    const mdPath = path.join(dirPath, `${this.article._id.toString()}.md`)
    await fs.writeFileSync(mdPath, content)

    // 上传markdown文件
    const handle = await this.page.$('input[accept=".md"]')
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

  /**
   * 输入编辑器后续操作
   */
  async afterInputEditor() {
    // 输入编辑器内容的后续处理
    // 点击发布文章
    const elPubBtn = await this.page.$('.btn-publish');
    await elPubBtn.click();
    await this.page.waitFor(5000);

    // 选择类别
    const categories = this.task.category.split(',')
    await this.page.evaluate((categories) => {
      for (const category of categories) {
        const elCategory = document.querySelector('.tag__option-chk[value="' + category + '"]')
        if (elCategory) {
          elCategory.click()
        }
      }
    }, categories)

    // 选择标签
    await this.page.click('.tag__btn-tag')
    await this.page.waitFor(1000)

    const tags = this.task.tag.split(',')
    const elTagInput = await this.page.$('input[placeholder="请输入文字搜索，Enter键入可添加自定义标签"]')
    for (const tag of tags) {
      // 清除已有内容
      await this.page.evaluate(() => {
        document.querySelector('input[placeholder="请输入文字搜索，Enter键入可添加自定义标签"]').value = ''
      })
      await this.page.waitFor(1000)

      // 输入标签
      await elTagInput.type(tag)
      await this.page.waitFor(3000)
      await this.page.evaluate(() => {
        const el = document.querySelector('.el-autocomplete-suggestion__list > li')
        if (el) {
          el.click()
        }
      })
      await this.page.waitFor(3000)
    }
  }

  async afterPublish() {
    this.task.url = await this.page.evaluate(() => {
      const el = document.querySelector('.toarticle');
      return el.getAttribute('href');
    });
    this.task.updateTs = new Date();
    await this.task.save();
  }

  async fetchStats() {
    if (!this.task.url) return;
    await this.page.goto(this.task.url, { timeout: 60000 });
    await this.page.waitFor(5000);

    const stats = await this.page.evaluate(() => {
      const text = document.querySelector('body').innerText;
      const mComment = text.match(/评论(\d+)/);
      const readNum = Number(document.querySelector('.read-count').innerText);
      const likeNum = Number(document.querySelector('#spanCount').innerText);
      const commentNum = mComment ? Number(mComment[1]) : 0
      return {
        readNum,
        likeNum,
        commentNum,
      };
    });
    this.task.readNum = stats.readNum;
    this.task.likeNum = stats.likeNum;
    this.task.commentNum = stats.commentNum;
    await this.task.save();
    await this.page.waitFor(3000);
  }
}

module.exports = CsdnSpider;
