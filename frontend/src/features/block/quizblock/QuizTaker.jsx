import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';

const normaliseOptions = (question) => {
  if (question.type === 'true_false') return ['True', 'False'];
  return (question.options || []).map((option) => (
    typeof option === 'object' ? option.text || '' : option
  ));
};

const isCorrect = (question, answer) => {
  if (question.type === 'short_answer') {
    return typeof answer === 'string'
      && answer.trim().toLocaleLowerCase() === (question.correctShortAnswer || '').trim().toLocaleLowerCase();
  }
  return answer === (question.correctAnswerIndex ?? 0);
};

// Kept intentionally local: this public player never sends learner answers or
// event data to analytics services.
export const QuizTaker = ({ block }) => {
  const questions = block.content?.questions || [];
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});

  if (!questions.length) {
    return <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted-foreground)]">Add a question in the inspector.</div>;
  }

  const reset = () => {
    setAnswers({});
    setChecked({});
  };

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">Practice</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--color-foreground)]">Check your understanding</h3>
        </div>
        {(Object.keys(answers).length > 0 || Object.keys(checked).length > 0) && (
          <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]">
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const type = question.type || 'multiple_choice';
          const options = normaliseOptions(question);
          const result = checked[index] ? isCorrect(question, answers[index]) : null;
          return (
            <div key={question.id || index} className="border-t border-[var(--color-border)] pt-5 first:border-t-0 first:pt-0">
              <p className="text-sm font-medium leading-6 text-[var(--color-foreground)]">{index + 1}. {question.question || 'New question'}</p>
              {type === 'short_answer' ? (
                <input
                  value={answers[index] || ''}
                  disabled={checked[index]}
                  onChange={(event) => setAnswers((previous) => ({ ...previous, [index]: event.target.value }))}
                  placeholder="Type your answer"
                  className="mt-3 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:opacity-75"
                />
              ) : (
                <div className="mt-3 grid gap-2">
                  {options.map((option, optionIndex) => {
                    const selected = answers[index] === optionIndex;
                    const correctOption = checked[index] && optionIndex === (question.correctAnswerIndex ?? 0);
                    const incorrectOption = checked[index] && selected && !correctOption;
                    return (
                      <button
                        key={`${option}-${optionIndex}`}
                        type="button"
                        disabled={checked[index]}
                        onClick={() => setAnswers((previous) => ({ ...previous, [index]: optionIndex }))}
                        className={`flex min-h-11 items-center rounded-md border px-3 text-left text-sm transition-colors disabled:cursor-default ${
                          correctOption ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : incorrectOption ? 'border-rose-300 bg-rose-50 text-rose-800' : selected ? 'border-indigo-400 bg-indigo-50 text-indigo-800' : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'
                        }`}
                      >
                        {option || `Option ${optionIndex + 1}`}
                      </button>
                    );
                  })}
                </div>
              )}
              {!checked[index] ? (
                <button
                  type="button"
                  disabled={answers[index] === undefined || answers[index] === ''}
                  onClick={() => setChecked((previous) => ({ ...previous, [index]: true }))}
                  className="mt-3 rounded-md bg-[var(--color-foreground)] px-3 py-2 text-xs font-medium text-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
                >Check answer</button>
              ) : (
                <div className={`mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-sm ${result ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {result ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
                  <span>{result ? 'Correct.' : 'Try again after reviewing the explanation.'}{question.explanation ? ` ${question.explanation}` : ''}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
