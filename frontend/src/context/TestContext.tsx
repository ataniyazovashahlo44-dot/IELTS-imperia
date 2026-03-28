import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  JoinTestResponse, SectionConfig, CurrentSection, SubmitAnswer
} from '../types';

type TestPhase = 'idle' | 'join' | 'in-section' | 'section-transition' | 'completed';

interface TestContextType {
  phase: TestPhase;
  testSessionId: string | null;
  title: string;
  sections: SectionConfig[];
  currentSection: CurrentSection | null;
  answers: Record<string, SubmitAnswer>;
  setAnswer: (questionId: string, answer: SubmitAnswer) => void;
  initTest: (data: JoinTestResponse) => void;
  goToNextSection: (nextSection: CurrentSection | null) => void;
  completeTest: () => void;
  getAllAnswers: () => SubmitAnswer[];
  reset: () => void;
}

const TestContext = createContext<TestContextType | null>(null);

export function TestProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [currentSection, setCurrentSection] = useState<CurrentSection | null>(null);
  const [answers, setAnswers] = useState<Record<string, SubmitAnswer>>({});

  const setAnswer = useCallback((questionId: string, answer: SubmitAnswer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const initTest = useCallback((data: JoinTestResponse) => {
    setTestSessionId(data.testSessionId);
    setTitle(data.title);
    setSections(data.sections);
    setCurrentSection(data.currentSection);
    setAnswers({});
    setPhase('in-section');
  }, []);

  const goToNextSection = useCallback((nextSection: CurrentSection | null) => {
    if (!nextSection) {
      setPhase('completed');
      setCurrentSection(null);
    } else {
      setCurrentSection(nextSection);
      setPhase('in-section');
    }
  }, []);

  const completeTest = useCallback(() => {
    setPhase('completed');
  }, []);

  const getAllAnswers = useCallback(() => Object.values(answers), [answers]);

  const reset = useCallback(() => {
    setPhase('idle');
    setTestSessionId(null);
    setTitle('');
    setSections([]);
    setCurrentSection(null);
    setAnswers({});
  }, []);

  return (
    <TestContext.Provider value={{
      phase, testSessionId, title, sections, currentSection,
      answers, setAnswer, initTest, goToNextSection, completeTest, getAllAnswers, reset
    }}>
      {children}
    </TestContext.Provider>
  );
}

export function useTest() {
  const ctx = useContext(TestContext);
  if (!ctx) throw new Error('useTest must be inside TestProvider');
  return ctx;
}
