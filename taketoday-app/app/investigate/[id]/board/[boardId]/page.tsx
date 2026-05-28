"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";

interface Column { id: string; name: string; color?: string }
interface Card {
  id: string;
  boardId: string;
  columnId: string;
  type: string;
  title: string;
  body?: string | null;
  position: number;
  priority: string;
  resolved: boolean;
  tags: string[];
  createdAt: string;
}
interface Board {
  id: string;
  name: string;
  description?: string | null;
  columns: Column[];
}

const CARD_TYPES = [
  "LEAD", "EVIDENCE", "SOURCE", "FINDING", "QUESTION",
  "DOCUMENT", "TIMELINE_EVENT", "PERSON", "ORGANIZATION",
] as const;

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const typeColors: Record<string, string> = {
  LEAD: "bg-indigo-50 text-indigo-700 border-indigo-200",
  EVIDENCE: "bg-blue-50 text-blue-700 border-blue-200",
  SOURCE: "bg-cyan-50 text-cyan-700 border-cyan-200",
  FINDING: "bg-green-50 text-green-700 border-green-200",
  QUESTION: "bg-yellow-50 text-yellow-700 border-yellow-200",
  DOCUMENT: "bg-orange-50 text-orange-700 border-orange-200",
  TIMELINE_EVENT: "bg-purple-50 text-purple-700 border-purple-200",
  PERSON: "bg-rose-50 text-rose-700 border-rose-200",
  ORGANIZATION: "bg-teal-50 text-teal-700 border-teal-200",
};

const priorityDots: Record<string, string> = {
  LOW: "bg-gray-300",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-600",
};

type Params = { params: Promise<{ id: string; boardId: string }> };

export default function ResearchBoardPage({ params }: Params) {
  const { id: investigationId, boardId } = use(params);

  const [board, setBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ title: "", type: "LEAD" as typeof CARD_TYPES[number], priority: "MEDIUM" as typeof PRIORITIES[number], body: "" });
  const [expandedCard, setExpandedCard] = useState<Card | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [boardRes, cardsRes] = await Promise.all([
        fetch(`/api/investigations/${investigationId}/board`),
        fetch(`/api/investigations/${investigationId}/board/cards`),
      ]);
      const boardData = (await boardRes.json()) as { data?: { boards: (Board & { id: string })[] } };
      const cardsData = (await cardsRes.json()) as { data?: { cards: Card[] } };

      const found = boardData.data?.boards.find((b) => b.id === boardId);
      if (found) setBoard(found);
      setCards(cardsData.data?.cards ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [investigationId, boardId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function addCard(columnId: string) {
    if (!newCard.title.trim()) return;

    const res = await fetch(`/api/investigations/${investigationId}/board/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId,
        columnId,
        type: newCard.type,
        title: newCard.title,
        body: newCard.body || undefined,
        priority: newCard.priority,
        position: cards.filter((c) => c.columnId === columnId).length,
      }),
    });

    const data = (await res.json()) as { data?: { card: Card } };
    if (data.data?.card) {
      setCards((prev) => [...prev, data.data!.card]);
    }
    setNewCard({ title: "", type: "LEAD", priority: "MEDIUM", body: "" });
    setAddingTo(null);
  }

  async function moveCard(cardId: string, targetColumnId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.columnId === targetColumnId) return;

    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, columnId: targetColumnId } : c));

    await fetch(`/api/investigations/${investigationId}/board/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, targetColumnId, position: 0 }),
    });
  }

  async function deleteCard(cardId: string) {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    await fetch(`/api/investigations/${investigationId}/board/cards?cardId=${cardId}`, { method: "DELETE" });
  }

  if (loading) return <div className="min-h-screen bg-paper flex items-center justify-center text-ink/40">Loading board…</div>;
  if (!board) return <div className="min-h-screen bg-paper flex items-center justify-center text-ink/40">Board not found</div>;

  const columns = board.columns as Column[];

  return (
    <div className="min-h-screen bg-paper">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/investigate/${investigationId}`} className="text-ink/50 hover:text-ink text-sm">← Investigation</Link>
          <span className="text-ink/20">/</span>
          <h1 className="font-medium text-ink">{board.name}</h1>
          {board.description && <span className="text-sm text-ink/50">— {board.description}</span>}
        </div>

        {/* Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colCards = cards.filter((c) => c.columnId === col.id).sort((a, b) => a.position - b.position);

            return (
              <div
                key={col.id}
                className="flex-shrink-0 w-72 bg-ink/3 border border-ink/8 rounded-xl overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData("cardId");
                  if (cardId) void moveCard(cardId, col.id);
                  setDragging(null);
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-ink/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color ?? "#999" }} />
                    <span className="text-sm font-medium text-ink">{col.name}</span>
                    <span className="text-xs text-ink/40 font-mono">{colCards.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAddingTo(col.id); setNewCard({ title: "", type: "LEAD", priority: "MEDIUM", body: "" }); }}
                    className="text-ink/40 hover:text-ink text-lg leading-none"
                    title="Add card"
                  >
                    +
                  </button>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[100px]">
                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData("cardId", card.id); setDragging(card.id); }}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => setExpandedCard(card)}
                      className={`bg-paper border border-ink/10 rounded-lg p-3 cursor-pointer hover:border-ink/25 hover:shadow-sm transition-all select-none ${dragging === card.id ? "opacity-40" : ""} ${card.resolved ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${typeColors[card.type] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {card.type.replace(/_/g, " ")}
                        </span>
                        <span className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${priorityDots[card.priority] ?? "bg-gray-300"}`} title={card.priority} />
                      </div>
                      <p className={`text-sm text-ink leading-snug ${card.resolved ? "line-through text-ink/40" : ""}`}>
                        {card.title}
                      </p>
                      {card.body && (
                        <p className="text-xs text-ink/50 mt-1 line-clamp-2">{card.body}</p>
                      )}
                      {card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs px-1.5 bg-ink/5 rounded text-ink/50">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add card form */}
                  {addingTo === col.id && (
                    <div className="bg-paper border border-ink/20 rounded-lg p-3 space-y-2">
                      <input
                        autoFocus
                        type="text"
                        value={newCard.title}
                        onChange={(e) => setNewCard((f) => ({ ...f, title: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") void addCard(col.id); if (e.key === "Escape") setAddingTo(null); }}
                        placeholder="Card title…"
                        className="w-full text-sm text-ink placeholder:text-ink/40 focus:outline-none border-b border-ink/15 pb-1.5"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newCard.type}
                          onChange={(e) => setNewCard((f) => ({ ...f, type: e.target.value as typeof CARD_TYPES[number] }))}
                          className="flex-1 text-xs border border-ink/15 rounded px-2 py-1 bg-paper text-ink focus:outline-none"
                        >
                          {CARD_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                        </select>
                        <select
                          value={newCard.priority}
                          onChange={(e) => setNewCard((f) => ({ ...f, priority: e.target.value as typeof PRIORITIES[number] }))}
                          className="text-xs border border-ink/15 rounded px-2 py-1 bg-paper text-ink focus:outline-none"
                        >
                          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void addCard(col.id)}
                          disabled={!newCard.title.trim()}
                          className="text-xs bg-ink text-paper px-3 py-1.5 rounded-lg hover:bg-ink/90 disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingTo(null)}
                          className="text-xs text-ink/50 hover:text-ink px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card detail modal */}
      {expandedCard && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setExpandedCard(null)}>
          <div className="bg-paper rounded-2xl max-w-lg w-full shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${typeColors[expandedCard.type] ?? ""}`}>
                  {expandedCard.type.replace(/_/g, " ")}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  expandedCard.priority === "CRITICAL" ? "bg-red-50 text-red-700" :
                  expandedCard.priority === "HIGH" ? "bg-orange-50 text-orange-700" :
                  expandedCard.priority === "MEDIUM" ? "bg-yellow-50 text-yellow-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {expandedCard.priority}
                </span>
              </div>
              <button type="button" onClick={() => setExpandedCard(null)} className="text-ink/40 hover:text-ink text-xl">×</button>
            </div>
            <h2 className="font-medium text-ink text-lg mb-3 leading-snug">{expandedCard.title}</h2>
            {expandedCard.body && <p className="text-sm text-ink/70 leading-relaxed mb-4">{expandedCard.body}</p>}
            <div className="text-xs text-ink/40 mb-4">{new Date(expandedCard.createdAt).toLocaleString()}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/investigations/${investigationId}/board/cards`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: expandedCard.id, resolved: !expandedCard.resolved }),
                  });
                  setCards((prev) => prev.map((c) => c.id === expandedCard.id ? { ...c, resolved: !c.resolved } : c));
                  setExpandedCard({ ...expandedCard, resolved: !expandedCard.resolved });
                }}
                className="text-xs border border-ink/20 text-ink/70 px-3 py-1.5 rounded-lg hover:bg-ink/5"
              >
                {expandedCard.resolved ? "↩ Reopen" : "✓ Mark resolved"}
              </button>
              <button
                type="button"
                onClick={() => { void deleteCard(expandedCard.id); setExpandedCard(null); }}
                className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
