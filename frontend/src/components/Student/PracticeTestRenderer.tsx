import { useCallback } from 'react';
import { ClientPracticeQuestion, SubmitAnswer } from '../../types';

interface Props {
  questions: ClientPracticeQuestion[];
  subject: string;
  answers: Record<string, SubmitAnswer>;
  onAnswer: (answer: SubmitAnswer) => void;
}

export default function PracticeTestRenderer({ questions, subject, answers, onAnswer }: Props) {

  const handleSelect = useCallback((question: ClientPracticeQuestion, optionText: string) => {
    onAnswer({
      questionId: question.id,
      questionType: subject as 'VOCABULARY' | 'GRAMMAR',
      selectedAnswer: optionText,
      questionText: question.text,
    });
  }, [subject, onAnswer]);

  return (
    <div className="h-full overflow-y-auto bg-[#FDFDFD] dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {questions.map((question, idx) => {
          const selected = answers[question.id]?.selectedAnswer;

          return (
            <div
              key={question.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              {/* Question header */}
              <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border-2 ${
                  selected
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {idx + 1}
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed pt-0.5">
                  {question.text}
                </p>
              </div>

              {/* Options */}
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((option) => {
                  const isSelected = selected === option.text;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleSelect(question, option.text)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-black border ${
                        isSelected
                          ? 'bg-white/20 border-white/30 text-white'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-300'
                      }`}>
                        {option.label}
                      </span>
                      <span className="text-sm font-medium">{option.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Bottom spacer */}
        <div className="h-6" />
      </div>
    </div>
  );
}
