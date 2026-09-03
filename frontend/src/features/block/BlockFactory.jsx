import React, { memo } from 'react';
import { TextEditor } from './textblock/TextEditor';
import { VideoBlock } from './videoblock/VideoBlock';
import { QuizTaker } from './quizblock/QuizTaker';
import { ImageBlock } from './imageblock/ImageBlock';

const BlockFactoryComponent = ({ block, isEditable, isSelected }) => {
  switch (block.type) {
    case 'text':
    case 'paragraph':
    case 'h1':
    case 'h2':
    case 'h3':
      return <TextEditor block={block} isEditable={isEditable} isSelected={isSelected} />;
    case 'image':
      return <ImageBlock block={block} isSelected={isSelected} />;
    case 'video':
      return <VideoBlock block={block} isEditable={isEditable} isSelected={isSelected} />;
    case 'quiz':
      return <QuizTaker block={block} isEditable={isEditable} suppressTracking />;
    default:
      return null;
  }
};

export const BlockFactory = memo(BlockFactoryComponent, (previous, next) => (
  previous.block === next.block
  && previous.isEditable === next.isEditable
  && previous.isSelected === next.isSelected
));
