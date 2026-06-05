import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Speech,
  HelpCircle,
  ArrowRight,
  Award,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  AlertCircle
} from 'lucide-react';

const getAnswerQualityWarning = (answer) => {
  const trimmed = answer.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const hasRepeatedChars = words.some(word => /(.)\1{3,}/.test(word));
  const hasSpecificSignal = /because|example|tradeoff|test|debug|measure|error|state|api|database|security|performance|component|function|class|async|cache|schema|hook|render|server|client/i.test(trimmed);

  if (words.length < 12) return 'Answer is too short for an honest interview score. Add reasoning and an example.';
  if (hasRepeatedChars) return 'This looks like random typing. It will be graded very low.';
  if (!hasSpecificSignal && words.length < 30) return 'Add topic-specific detail, not just a positive or generic statement.';
  return '';
};

const AiInterview = () => {
  const { token } = useSelector((state) => state.auth);

  const [skillChoice, setSkillChoice] = useState('React.js');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState([]); // Array of { questionId, questionText, userResponse }
  
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const answerWarning = getAnswerQualityWarning(typedAnswer);

  const skillOptions = [
    'React.js',
    'JavaScript ES6+',
    'Node.js & Express',
    'MongoDB & Mongoose',
    'Core Java',
    'Python Basics',
    'Figma Prototyping',
    'Pandas & NumPy',
    'Machine Learning (Scikit-Learn)',
    'Ethical Hacking & Pen Testing',
    'React Native',
    'Spring Boot'
  ];

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setEvaluationResult(null);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('/api/ai/mock-interview/start', { skillName: skillChoice }, config);
      setQuestions(res.data.questions);
      setInterviewStarted(true);
    } catch (err) {
      console.error('Error starting interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;

    const currentQ = questions[currentQuestionIndex];
    const newAnswerEntry = {
      questionId: currentQ.id || currentQuestionIndex + 1,
      questionText: currentQ.question,
      userResponse: typedAnswer.trim()
    };

    const updatedAnswers = [...userAnswers, newAnswerEntry];
    setUserAnswers(updatedAnswers);
    setTypedAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Completed all questions, trigger evaluation
      triggerEvaluation(updatedAnswers);
    }
  };

  const triggerEvaluation = async (answersPayload) => {
    setEvaluating(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('/api/ai/mock-interview/evaluate', { answers: answersPayload }, config);
      setEvaluationResult(res.data.evaluation);
    } catch (err) {
      console.error('Error evaluating interview answers:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleReset = () => {
    setInterviewStarted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setEvaluationResult(null);
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200 overflow-y-auto">
      {/* Brand Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/60 to-slate-900/60 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Speech size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight">AI Mock Interviews</h1>
            <p className="text-sm text-slate-400 mt-1">Interactive chatbot testing your technical skills with custom grading</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Step 1 - Choose Skill Form */}
        {!interviewStarted && (
          <div className="glass-panel p-8 rounded-3xl space-y-6 animate-fade-in text-center">
            <span className="text-4xl">🤖</span>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100 font-outfit">Select Interview Skill Topic</h2>
              <p className="text-xs text-slate-400">Choose a skill to test. You will get varied technical and behavioral questions with strict, evidence-based scoring.</p>
            </div>

            <form onSubmit={handleStartInterview} className="space-y-5 max-w-sm mx-auto">
              <select
                value={skillChoice}
                onChange={(e) => setSkillChoice(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs outline-none"
              >
                {skillOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white text-xs transition-all flex items-center justify-center gap-2 shadow"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    <span>Begin Mock Interview</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2 - Live Interview Q/A Console */}
        {interviewStarted && !evaluationResult && (
          <div className="glass-panel p-6 rounded-3xl space-y-6 animate-fade-in">
            {/* Progression bar */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Skill Topic: {skillChoice}</span>
                <h4 className="font-extrabold text-sm text-slate-200 mt-0.5">Question {currentQuestionIndex + 1} of {questions.length}</h4>
              </div>
              <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question Bubble */}
            {questions.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-900/10 border border-indigo-900/20 text-indigo-300 text-xs font-semibold leading-relaxed">
                  <HelpCircle size={16} className="inline mr-2 text-indigo-400 flex-shrink-0" />
                  <span>{questions[currentQuestionIndex].question}</span>
                </div>

                <form onSubmit={handleAnswerSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Type your answer response</label>
                    <textarea
                      required
                      rows={5}
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder="Use: direct answer, reason, example, tradeoff, and how you would test or verify it."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 text-xs outline-none focus:border-indigo-500 leading-relaxed"
                    />
                    {answerWarning && (
                      <p className="text-[11px] font-semibold text-amber-300">{answerWarning}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Submit & Proceed</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Step 3 - Evaluating loading */}
        {evaluating && (
          <div className="glass-panel p-12 rounded-3xl flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 animate-pulse">Evaluating answers via Gemini grading algorithms...</span>
          </div>
        )}

        {/* Step 4 - Detailed Evaluation Dashboard */}
        {evaluationResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Score Summary Panel */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Interview Complete</span>
                <h2 className="text-2xl font-bold text-slate-100 font-outfit">Detailed Grade Analysis</h2>
                {evaluationResult.verdict && (
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300">{evaluationResult.verdict}</p>
                )}
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">{evaluationResult.detailedFeedback}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-indigo-500 flex items-center justify-center shadow-lg relative">
                  <Trophy size={18} className="absolute top-1 right-1 text-amber-500" />
                  <span className="text-2xl font-extrabold text-white">{evaluationResult.score}%</span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase mt-2">Overall Score</span>
              </div>
            </div>

            {evaluationResult.perQuestion?.length > 0 && (
              <div className="glass-panel p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Award size={16} className="text-amber-400" /> Question Review
                </h3>
                <div className="space-y-3">
                  {evaluationResult.perQuestion.map((item, idx) => (
                    <div key={item.questionId || idx} className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Question {idx + 1}</span>
                        <span className="text-xs font-extrabold text-slate-100">{Math.round(item.score || 0)}%</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths and Weaknesses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="glass-panel p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400" /> Strengths
                </h3>
                <ul className="text-xs text-slate-400 space-y-2.5 list-disc list-inside leading-relaxed">
                  {evaluationResult.strengths?.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="glass-panel p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400" /> Improvement Areas
                </h3>
                <ul className="text-xs text-slate-400 space-y-2.5 list-disc list-inside leading-relaxed">
                  {evaluationResult.weaknesses?.map((weak, idx) => (
                    <li key={idx}>{weak}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actionable Suggestions */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" /> Actionable Suggestions
              </h3>
              <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-300">
                {evaluationResult.suggestions?.map((sug, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl">
                    {sug}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="profile-edit-button w-full py-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <RotateCcw size={14} />
              <span>Interview on Another Skill</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiInterview;
