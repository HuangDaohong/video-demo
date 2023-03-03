import { FC, HTMLAttributes } from 'react';
import { VideoData } from '../../constants/data';
import styles from './styles.module.scss';

//这里的 Props 继承了 HTMLAttributes<HTMLDivElement>，这样就可以在组件中使用 div 的所有属性
interface Props extends HTMLAttributes<HTMLDivElement> {
  list: VideoData[];
  // onScroll?: () => void;
}

const Category: FC<Props> = (props) => {
  const { list, ...divProps } = props; // 通过解构赋值，将 list 从 props 中剥离出来，剩下的部分赋值给 divProps, divProps 是一个对象，包含了除了 list 以外的所有属性

  return (
    <div {...divProps} className={styles.category}>
      <ul>
        {list.map((videoData) => (
          <li key={videoData.id}>
            <video data-video-id={videoData.id} loop muted src={videoData.src}></video>
            {/* data-video-id属性用于标记视频的id，方便后续通过id找到对应的video元素 */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Category;
