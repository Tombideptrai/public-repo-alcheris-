import { ImageInspector } from './blocks/ImageInspector';
import { QuizInspector } from './blocks/QuizInspector';
import { TextInspector } from './blocks/TextInspector';
import { VideoInspector } from './blocks/VideoInspector';

const inspectors = {
  text: TextInspector,
  paragraph: TextInspector,
  h1: TextInspector,
  h2: TextInspector,
  h3: TextInspector,
  image: ImageInspector,
  video: VideoInspector,
  quiz: QuizInspector,
};

export const getInspector = (type) => inspectors[type] || (() => <div className="p-8 text-center opacity-50">No settings available.</div>);
export const hasInspector = (type) => Boolean(inspectors[type]);
