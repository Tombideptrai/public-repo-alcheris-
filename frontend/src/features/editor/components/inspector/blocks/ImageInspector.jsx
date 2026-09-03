import React from 'react';
import { InspectorInput, PropertySection } from '../ui/InspectorUI';

export const ImageInspector = ({ block, updateBlockContent }) => <PropertySection title="Image"><div className="space-y-3"><InspectorInput value={block.content?.url || ''} onChange={(event) => updateBlockContent(block.id, { url: event.target.value })} placeholder="Image URL" /><InspectorInput value={block.content?.altText || ''} onChange={(event) => updateBlockContent(block.id, { altText: event.target.value })} placeholder="Alt text" /><InspectorInput value={block.content?.caption || ''} onChange={(event) => updateBlockContent(block.id, { caption: event.target.value })} placeholder="Caption (optional)" /></div></PropertySection>;
