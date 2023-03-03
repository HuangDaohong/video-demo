import React, { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from './components/NavBar';
import Tabs from './components/Tabs';
import BannerImage from './assets/banner.png';
import FooterImage from './assets/footer.jpg';
import Category from './components/Cateogry';
import { cloneWith, debounce } from 'lodash';

import styles from './styles.module.scss';
import { dataSource } from './constants/data';
import classNames from 'classnames';

// 1. 可以显示和隐藏的 NavBar
//  1.1 往下滚动，则隐藏
//  1.2 往上滚动，则展示
// 2. 可以吸底的 Tabs
// 3. 视频流
//   3.1 命中红线，会播放
//   3.2 未命中红线，播放上一次播放的视频
//   3.3 滚动时，暂停视频
//   3.4 初始时，播放头两个视频
//   3.5 横向滚动时，在可视窗口时播放

/**
 * @description: 判断元素是否在可视窗口内，是则返回 true，否则返回 false
 * @param {HTMLVideoElement} el，需要判断的元素，这里是 video 元素，但是也可以是其他元素
 */
const isInView = (el: HTMLVideoElement) => {
  const { top, bottom, left, right } = el.getBoundingClientRect(); // 获取元素的位置信息,getBoundingClientRect 方法返回元素的大小及其相对于视口的位置

  // 水平方向
  const isHorizontalInView = 0 < left && right < window.innerWidth; // window.innerWidth 属性返回窗口的文档显示区的宽度，包括滚动条的宽度
  // 垂直方向
  const isVerticalInView = top < window.innerHeight / 2 && window.innerHeight / 2 < bottom; // window.innerHeight 属性返回窗口的文档显示区的高度 window.innerHeight / 2 表示红线的位置
  // 最终结果
  return isHorizontalInView && isVerticalInView; // 水平方向和垂直方向都在可视窗口内，则返回 true
};

const App = () => {
  const oldYRef = useRef<number>(0); // 用于记录上一次滚动的位置
  const contentRef = useRef<HTMLDivElement>(null); // 用于记录Y轴滚动
  const offsetRef = useRef<HTMLDivElement>(null); // 用于记录偏移量的位置,
  const playingIds = useRef<string[]>([]); // 用于记录当前正在播放的视频的 Id
  const isScrolling = useRef<boolean>(false); // 用于记录是否正在滚动

  const [hidden, setHidden] = useState<boolean>(false); // 用于记录 NavBar 是否隐藏

  const playAll = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    // 这种方法消耗性能
    // ids.forEach((id) => {
    //   const videoEl = document.querySelector<HTMLVideoElement>(`[data-video-id="${id}"]`);
    //   if (videoEl) {
    //     videoEl.play();
    //   }
    // });

    const selector = ids.map((id) => `[data-video-id="${id}"]`).join(','); // 通过 data-video-id 属性找到对应的 video 元素,
    const videoEls: HTMLVideoElement[] = Array.from(document.querySelectorAll(selector)); // 将 video 元素转换为数组
    videoEls.forEach((el) => el.play()); //play()来自于HTMLMediaElement，HTMLMediaElement是HTMLVideoElement的父类，所以video元素也可以调用play()方法

    playingIds.current = ids;
  };

  const stopAll = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    const selector = ids.map((id) => `[data-video-id="${id}"]`).join(',');
    // 通过 data-video-id 属性找到对应的 video 元素,data-video-id是自定义属性，不是原生属性，
    const videoEls: HTMLVideoElement[] = Array.from(document.querySelectorAll(selector));

    videoEls.forEach((el) => {
      el.pause();
      el.currentTime = 0;
    });
  };

  const pauseAll = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    const selector = ids.map((id) => `[data-video-id="${id}"]`).join(',');
    const videoEls: HTMLVideoElement[] = Array.from(document.querySelectorAll(selector));

    videoEls.forEach((el) => el.pause());
  };

  const onScrollEnd = useCallback(
    // useCallback 用于缓存函数，避免每次渲染都重新生成函数
    debounce(() => {
      // 找到所有的视频
      const videoEls = Array.from(document.querySelectorAll('video'));

      // 找到命中规则的视频
      const inViewVideoEls = videoEls.filter((el) => isInView(el));

      if (inViewVideoEls.length > 0) {
        const ids: string[] = inViewVideoEls.map((el) => el.getAttribute('data-video-id') || '');
        // getAttribute() 方法返回指定属性名的属性值。如果指定的属性不存在，则返回 null。如 data-video-id="123"，getAttribute('data-video-id') 返回 123

        // 旧视频（以前的 Id 不在这次播放列表中的）
        const stopIds = playingIds.current.filter((id) => !ids.includes(id));
        stopAll(stopIds);

        // 播放新视频
        playAll(ids);
      } else {
        playAll(playingIds.current);
      }

      isScrolling.current = false;
    }, 500),
    []
  );

  const onScroll = () => {
    if (!isScrolling.current) {
      pauseAll(playingIds.current);
    }

    isScrolling.current = true;

    if (contentRef.current && offsetRef.current) {
      const { bottom: offsetBottom } = offsetRef.current.getBoundingClientRect();

      // 下滑超过 56 px 才做交互
      if (offsetBottom < 0) {
        const { top: newY } = contentRef.current.getBoundingClientRect(); // getBoundingClientRect 方法返回元素的大小及其相对于视口的位置,contentRef.current是一个div元素,它的方法还有：offsetTop,offsetLeft,offsetWidth,offsetHeight
        // 计算向上还是向下滑动
        const delta = newY - oldYRef.current; // newY是当前的Y轴坐标，oldYRef.current是上一次的Y轴坐标

        // 更新上一次的 Y 值
        oldYRef.current = newY;

        setHidden(delta < 0);
      }
    }

    // 停下来超过 500ms 则认为是 scroll end
    onScrollEnd(); //为什么不把函数写在这里，而是写在上面？ 因为这样写，函数只会被创建一次，而不是每次滚动都创建一次，这样会消耗性能，
  };

  useEffect(() => {
    const initVideoIds = dataSource.hot.list.slice(0, 2).map((item) => item.id);
    playAll(initVideoIds);
  }, []);

  return (
    <div className={styles.app}>
      {/* 
        （1）传入一个对象：classnames({class1:true,class2:false}) ，true表示相应的class生效，反之false表示不生效。
        （2）接受多个类名：classnames(class1,class2,{ class3:false })
      */}
      <header className={classNames(styles.header, { [styles.hidden1]: hidden })}>
        <NavBar title="首页" />
        <Tabs />
      </header>

      <div className={styles.line}></div>

      <div className={styles.scrollView} onScroll={onScroll}>
        <div ref={offsetRef} className={styles.offset} />

        <img className={styles.banner} src={BannerImage} alt="Banner" />

        <div ref={contentRef} className={styles.content}>
          <h2>{dataSource.hot.title}</h2>
          <Category onScroll={onScroll} list={dataSource.hot.list} />

          <h2>{dataSource.live.title}</h2>
          <Category onScroll={onScroll} list={dataSource.live.list} />

          <h2>{dataSource.recommend.title}</h2>
          <Category onScroll={onScroll} list={dataSource.recommend.list} />
        </div>

        <img className={styles.banner} src={FooterImage} alt="Banner" />

        <footer className={styles.footer}>
          <span>@Bilibili 2022</span>
        </footer>
      </div>
    </div>
  );
};

export default App;
