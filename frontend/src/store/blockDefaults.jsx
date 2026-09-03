const emptyHtml = '<p dir="ltr"><br></p>';
const heading = (tag) => ({ root: { children: [{ type: 'heading', tag, version: 1, children: [] }], type: 'root', version: 1 } });
const paragraph = () => ({ root: { children: [{ type: 'paragraph', version: 1, children: [] }], type: 'root', version: 1 } });

export const getBlockDefaults = (type) => {
  if (['text', 'paragraph'].includes(type)) return { html: emptyHtml, json: paragraph(), fontSize: '16px', textAlign: 'left', textColor: 'inherit' };
  if (['h1', 'h2', 'h3'].includes(type)) return { html: `<${type}>${type === 'h1' ? 'New heading' : ''}</${type}>`, json: heading(type), fontSize: type === 'h1' ? '32px' : type === 'h2' ? '24px' : '20px', fontWeight: 'bold', textAlign: 'left', textColor: 'inherit' };
  if (type === 'image') return { url: '', caption: '', altText: 'Image description' };
  if (type === 'video') return { url: '', sourceType: 'youtube' };
  if (type === 'quiz') return { mode: 'practice', questions: [{ id: 'question-1', type: 'multiple_choice', question: 'New question', options: ['Option 1', 'Option 2'], correctAnswerIndex: 0, correctShortAnswer: '', explanation: '' }] };
  return {};
};
