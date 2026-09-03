import React from 'react';
import { InspectorInput, PropertySection } from '../ui/InspectorUI';

export const VideoInspector = ({ block, updateBlockContent }) => <PropertySection title="Video"><InspectorInput value={block.content?.url || ''} onChange={(event) => updateBlockContent(block.id, { url: event.target.value })} placeholder="YouTube or direct video URL" /></PropertySection>;
