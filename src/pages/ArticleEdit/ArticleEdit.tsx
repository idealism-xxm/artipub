import React, {ChangeEventHandler, useEffect} from 'react';
// import {PageHeaderWrapper} from '@ant-design/pro-layout';
import BlankLayout from '@/layouts/BlankLayout';
// import UserLayout from '@/layouts/UserLayout';
import {ArticleModelState} from '@/models/article';
import {ConnectProps, ConnectState, Dispatch} from '@/models/connect';
import {connect} from 'dva';
import {Button, Input, message} from 'antd';
// @ts-ignore
import MarkdownIt from 'markdown-it';
import MdEditor from "react-markdown-editor-lite";

// 引入codemirror样式
import style from './ArticleEdit.scss';
import 'codemirror/mode/markdown/markdown';
import {router} from 'umi';

export interface ArticleEditProps extends ConnectProps {
  article: ArticleModelState;
  dispatch: Dispatch;
}

const ArticleEdit: React.FC<ArticleEditProps> = props => {
  const {dispatch, article} = props;

  const isEdit = (): Boolean => {
    return (
      !!location.hash.match(/edit/) ||
      (!!article.currentArticle && !!article.currentArticle._id)
    );
  };

  useEffect(() => {
    if (dispatch) {
      if (isEdit()) {
        // 如果为编辑文章
        const arr = location.hash.split('/');
        dispatch({
          type: 'article/fetchArticle',
          payload: {
            id: arr[arr.length - 1],
          },
        });
      } else {
        // 如果为新增文章
      }
    }
  }, []);

  // 更新标题
  const onTitleChange: ChangeEventHandler<HTMLInputElement> = ev => {
    // console.log(article.currentArticle);
    // console.log(ev.target.value);
    if (dispatch) {
      dispatch({
        type: 'article/setArticleTitle',
        payload: {
          title: ev.target.value,
        },
      });
    }
  };

  // 更新内容
  const onContentChange = (data: any) => {
    const text = data.text;
    const html = data.html;
    if (dispatch) {
      dispatch({
        type: 'article/setArticleContent',
        payload: {
          content: text,
          contentHtml: html,
        },
      });
    }
  };

  // 更新链接页脚
  const onLinkFooterChange = (data: any) => {
    const text = data.text;
    const html = data.html;
    if (dispatch) {
      dispatch({
        type: 'article/setArticleLinkFooter',
        payload: {
          linkFooter: text,
          linkFooterHtml: html,
        },
      });
    }
  };

  // 更新二维码页脚
  const onQrFooterChange = (data: any) => {
    const text = data.text;
    const html = data.html;
    if (dispatch) {
      dispatch({
        type: 'article/setArticleQrFooter',
        payload: {
          qrFooter: text,
          qrFooterHtml: html,
        },
      });
    }
  };

  const onImageUpload = (data: any) => {
    console.log(data);
  };

  // markdown to html转换器
  const mdParser = new MarkdownIt();

  // 调整CodeMirror高度
  setTimeout(() => {
    const $el = document.querySelector('.CodeMirror');
    if ($el) {
      $el.setAttribute('style', 'min-height:calc(100vh - 50px - 50px);box-shadow:none');
    }
  }, 100);

  // 点击保存
  const onSave = async () => {
    if (article.currentArticle) {
      // 文章标题校验
      if (article.currentArticle.title.length < 5) {
        message.error('标题字数不得小于5');
        return;
      }

      // 文章内容校验
      if (article.currentArticle.content.length < 10) {
        message.error('内容字数不得小于9');
        return;
      }
    }

    if (isEdit()) {
      // 如果为编辑文章
      await dispatch({
        type: 'article/saveCurrentArticle',
        payload: article.currentArticle,
      });
      message.success('文章保存成功');
    } else {
      // 如果为创建文章
      await dispatch({
        type: 'article/newArticle',
        payload: article.currentArticle,
      });
      message.success('文章保存成功');
    }
  };

  // 点击返回
  const onBack = () => {
    router.push('/articles');
  };

  return (
    <BlankLayout>
      <div className={style.articleEdit}>
        {/*标题*/}
        <div className={style.topBar}>
          <Input
            className={style.title}
            placeholder="文章标题"
            value={ article?.currentArticle?.title || ''}
            onChange={onTitleChange}
          />
          <div className={style.actions}>
            <Button className={style.backBtn} type="default" onClick={onBack}>
              返回
            </Button>
            <Button className={style.saveBtn} type="primary" onClick={onSave}>
              保存
            </Button>
          </div>
        </div>

        {/*主要内容*/}
        <div className={style.main}>
          <MdEditor
            name={"文章内容"}
            style={{width: '100%', height: 'calc(100vh - 250px)'}}
            value={ article?.currentArticle?.content || ''}
            renderHTML={(text) => {
              const html = mdParser.render(text);
              dispatch({
                type: 'article/setArticleContentHtml',
                payload: {
                  contentHtml: html,
                },
              });
              return html;
            }}
            onChange={onContentChange}
            onImageUpload={onImageUpload}
          />
        </div>

        {/*链接页脚（用于引流，部分平台不会允许此内容，需要屏蔽）*/}
        <div className={style.main}>
          <MdEditor
            name={"链接页脚"}
            config={{view: {menu: false, md: true, html: true}}}
            style={{width: '100%', height: '100px'}}
            value={ article?.currentArticle?.linkFooter || '' }
            renderHTML={(text) => {
              const html = mdParser.render(text);
              dispatch({
                type: 'article/setArticleLinkFooterHtml',
                payload: {
                  linkFooterHtml: html,
                },
              });
              return html;
            }}
            onChange={onLinkFooterChange}
            onImageUpload={onImageUpload}
          />
        </div>

        {/*二维码页脚（用于引流，部分平台不会允许此内容，需要屏蔽）*/}
        <div className={style.main}>
          <MdEditor
            name={"二维码页脚"}
            config={{view: {menu: false, md: true, html: true}}}
            style={{width: '100%', height: '100px'}}
            value={ article?.currentArticle?.qrFooter || ''}
            renderHTML={(text) => {
              const html = mdParser.render(text);
              dispatch({
                type: 'article/setArticleQrFooterHtml',
                payload: {
                  qrFooterHtml: html,
                },
              });
              return html;
            }}
            onChange={onQrFooterChange}
            onImageUpload={onImageUpload}
          />
        </div>
      </div>
    </BlankLayout>
  );
};

export default connect(({article}: ConnectState) => ({
  article,
}))(ArticleEdit);
