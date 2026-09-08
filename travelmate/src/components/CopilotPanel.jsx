import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Check, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const quickActions = [
  "Show my current trip",
  "What's my remaining budget?",
  "Check tomorrow's weather",
  "Make my trip cheaper",
];

function ProposalCard({ proposal, onApply, onKeep }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply(proposal);
      setApplied(true);
    } finally {
      setApplying(false);
    }
  };

  if (applied) {
    return (
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
        <Check size={14} /> Changes applied to your trip.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 space-y-2.5 max-w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Proposed Changes</span>
        {proposal.newFeasibilityScore != null && (
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{proposal.newFeasibilityScore}% feasible</span>
        )}
      </div>

      {proposal.originalCost != null && proposal.newCost != null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 line-through">${proposal.originalCost}</span>
          <ArrowRight size={12} className="text-gray-400" />
          <span className="font-bold text-emerald-600 dark:text-emerald-400">${proposal.newCost}</span>
        </div>
      )}

      {proposal.changesSummary?.length > 0 && (
        <ul className="space-y-1">
          {proposal.changesSummary.map((c, i) => (
            <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
              <span className="text-sky-500">•</span> {c}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onKeep}
          className="flex-1 text-xs font-semibold py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          Keep Current Plan
        </button>
        <button
          onClick={handleApply}
          disabled={applying}
          className="flex-1 text-xs font-semibold py-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white disabled:opacity-60 flex items-center justify-center gap-1"
        >
          {applying ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Apply
        </button>
      </div>
    </div>
  );
}

export default function CopilotPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your TravelMate Copilot. Ask me about your trips, budget, weather, or destinations." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  if (!user) return null;

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const { data } = await api.post("/copilot/message", { message: trimmed });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          intent: data.intent,
          proposal: data.suggestsAction ? data.proposal : null,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong reaching the Copilot. Please try again.", isError: true }]);
    } finally {
      setSending(false);
    }
  };

  const handleApplyProposal = async (proposal) => {
    await api.post("/copilot/apply-proposal", {
      tripId: proposal.tripId,
      proposedDays: proposal.proposedDays,
    });
  };

  const handleKeepProposal = (index) => {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, proposal: null, kept: true } : m)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 shadow-lg shadow-sky-500/30 flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Open TravelMate Copilot"
        >
          <Sparkles size={22} className="text-white" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[32rem] max-h-[75vh] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-fadeUp">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="font-bold text-sm">TravelMate Copilot</span>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-br-sm"
                      : m.isError
                      ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 rounded-bl-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>

                {m.proposal && (
                  <div className="mt-2 w-full max-w-[90%]">
                    <ProposalCard proposal={m.proposal} onApply={handleApplyProposal} onKeep={() => handleKeepProposal(i)} />
                  </div>
                )}

                {m.kept && (
                  <div className="mt-2 text-xs text-gray-400 italic">Kept current plan.</div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-sky-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {messages.length === 1 && !sending && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickActions.map((qa) => (
                <button
                  key={qa}
                  onClick={() => sendMessage(qa)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 transition"
                >
                  {qa}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your trip..."
              disabled={sending}
              className="flex-1 rounded-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-sky-500 outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform flex-shrink-0"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}