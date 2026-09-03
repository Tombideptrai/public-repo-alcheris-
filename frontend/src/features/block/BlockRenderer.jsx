import React from 'react';
import { TextRenderer } from './textblock/TextRenderer';
import { ImageRenderer } from './imageblock/ImageRenderer';
import { VideoBlock } from './videoblock/VideoBlock';
import { QuizTaker } from './quizblock/QuizTaker';

// The public coursework build deliberately exposes only the blocks used in the
// assignment: writing, media, and straightforward practice questions.
export const BlockRenderer = ({ block, isFullPanelMode, showEmptyPrompt = false }) => {
  switch (block.type) {
    case 'text':
    case 'paragraph':
    case 'h1':
    case 'h2':
    case 'h3':
      return <TextRenderer block={block} showEmptyPrompt={showEmptyPrompt} />;

    case 'video':
      return <VideoBlock block={block} isEditable={false} />;

    case 'image':
      return <ImageRenderer block={block}/>;
      
    case 'quiz':
      return <QuizTaker block={block} isFullPanelMode={isFullPanelMode} />;

    default:
      return null;
  }
};
