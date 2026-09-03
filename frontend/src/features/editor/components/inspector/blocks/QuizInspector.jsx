import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useLessonStore } from '../../../../../store/useLessonStore';

const newQuestion = () => ({ id: `question-${crypto.randomUUID()}`, type: 'multiple_choice', question: 'New question', options: ['Option 1', 'Option 2'], correctAnswerIndex: 0, correctShortAnswer: '', explanation: '' });

export const QuizInspector = ({ block }) => {
  const updateBlockContent = useLessonStore((state) => state.updateBlockContent);
  const questions = block.content?.questions?.length ? block.content.questions : [newQuestion()];
  const updateQuestions = (next) => updateBlockContent(block.id, { questions: next });
  const updateQuestion = (index, patch) => updateQuestions(questions.map((question, itemIndex) => itemIndex === index ? { ...question, ...patch } : question));

  return (
    <div className="space-y-4">
      {questions.map((question, questionIndex) => (
        <section key={question.id || questionIndex} className="space-y-3 rounded-lg border border-[var(--color-border)] p-3">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase text-[var(--color-muted-foreground)]">Question {questionIndex + 1}</p>{questions.length > 1 && <button type="button" aria-label="Delete question" onClick={() => updateQuestions(questions.filter((_, index) => index !== questionIndex))} className="text-[var(--color-error)]"><Trash2 size={15} /></button>}</div>
          <textarea value={question.question || ''} onChange={(event) => updateQuestion(questionIndex, { question: event.target.value })} className="w-full rounded border border-[var(--color-border)] bg-transparent p-2 text-sm" rows="2" placeholder="Question" />
          <select value={question.type || 'multiple_choice'} onChange={(event) => { const type = event.target.value; updateQuestion(questionIndex, { type, options: type === 'true_false' ? ['True', 'False'] : type === 'short_answer' ? [] : (question.options?.length ? question.options : ['Option 1', 'Option 2']), correctAnswerIndex: 0, correctShortAnswer: '' }); }} className="w-full rounded border border-[var(--color-border)] bg-transparent p-2 text-sm"><option value="multiple_choice">Multiple choice</option><option value="true_false">True / false</option><option value="short_answer">Short answer</option></select>
          {question.type === 'short_answer' ? <input value={question.correctShortAnswer || ''} onChange={(event) => updateQuestion(questionIndex, { correctShortAnswer: event.target.value })} className="w-full rounded border border-[var(--color-border)] bg-transparent p-2 text-sm" placeholder="Expected answer" /> : <div className="space-y-2">{(question.options || []).map((option, optionIndex) => <div className="flex gap-2" key={optionIndex}><input type="radio" name={`correct-${questionIndex}`} checked={question.correctAnswerIndex === optionIndex} onChange={() => updateQuestion(questionIndex, { correctAnswerIndex: optionIndex })} /><input value={option} onChange={(event) => updateQuestion(questionIndex, { options: question.options.map((item, index) => index === optionIndex ? event.target.value : item) })} className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-transparent p-2 text-sm" />{question.type === 'multiple_choice' && question.options.length > 2 && <button type="button" aria-label="Delete option" onClick={() => updateQuestion(questionIndex, { options: question.options.filter((_, index) => index !== optionIndex), correctAnswerIndex: 0 })}><Trash2 size={14} /></button>}</div>)}{question.type === 'multiple_choice' && <button type="button" onClick={() => updateQuestion(questionIndex, { options: [...(question.options || []), `Option ${(question.options || []).length + 1}`] })} className="text-xs text-[var(--color-primary)]">Add option</button>}</div>}
          <textarea value={question.explanation || ''} onChange={(event) => updateQuestion(questionIndex, { explanation: event.target.value })} className="w-full rounded border border-[var(--color-border)] bg-transparent p-2 text-sm" rows="2" placeholder="Optional feedback" />
        </section>
      ))}
      <button type="button" onClick={() => updateQuestions([...questions, newQuestion()])} className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[var(--color-border)] p-2 text-sm text-[var(--color-primary)]"><Plus size={15} /> Add question</button>
    </div>
  );
};
