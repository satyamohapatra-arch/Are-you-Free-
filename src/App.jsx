import { useState, useEffect } from "react";
import { Beer, PartyPopper, X, Plus, RotateCcw, ChevronDown } from "lucide-react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_SHORT = { Monday:"Mon", Tuesday:"Tue", Wednesday:"Wed", Thursday:"Thu", Friday:"Fri", Saturday:"Sat", Sunday:"Sun" };

const PERSON_COLORS = {
  HR:   { fill: "#D4537E", soft: "#FBEAF0", text: "#72243E" },
  BADS: { fill: "#1D9E75", soft: "#E1F5EE", text: "#085041" },
  FIN:  { fill: "#7F77DD", soft: "#EEEDFE", text: "#3C3489" },
  MAR:  { fill: "#D85A30", soft: "#FAECE7", text: "#712B13" }
};

const DEFAULT_BASE = {
  HR: {
    name: "Rashi", tag: "HR",
    Monday: [["11:50 AM","1:50 PM"],["2:50 PM","4:50 PM"]],
    Tuesday: [["9:30 AM","11:30 AM"],["2:50 PM","4:50 PM"]],
    Wednesday: [["9:30 AM","11:30 AM"],["11:50 AM","1:50 PM"]],
    Thursday: [["9:30 AM","11:30 AM"],["11:50 AM","1:50 PM"]],
    Friday: [["11:50 AM","1:50 PM"]],
    Saturday: [["9:30 AM","11:30 AM"]],
    Sunday: []
  },
  BADS: {
    name: "Satya", tag: "BADS",
    Monday: [["9:30 AM","11:30 AM"],["2:50 PM","4:50 PM"]],
    Tuesday: [["11:50 AM","1:50 PM"],["2:50 PM","4:50 PM"]],
    Wednesday: [],
    Thursday: [["9:30 AM","11:30 AM"],["11:50 AM","1:50 PM"]],
    Friday: [["9:30 AM","11:30 AM"],["11:50 AM","1:50 PM"]],
    Saturday: [],
    Sunday: []
  },
  FIN: {
    name: "Saurav", tag: "FIN",
    Monday: [["11:50 AM","1:50 PM"]],
    Tuesday: [["11:50 AM","1:50 PM"],["2:50 PM","4:50 PM"]],
    Wednesday: [],
    Thursday: [["9:30 AM","11:30 AM"],["11:50 AM","1:50 PM"]],
    Friday: [["9:30 AM","4:50 PM"]],
    Saturday: [],
    Sunday: []
  },
  MAR: {
    name: "Akshita", tag: "MAR",
    Monday: [["9:30 AM","11:30 AM"],["11:50 AM","1:50 PM"]],
    Tuesday: [["11:50 AM","1:50 PM"],["2:50 PM","4:50 PM"]],
    Wednesday: [],
    Thursday: [["9:30 AM","11:30 AM"],["11:50 AM","1:50 PM"]],
    Friday: [["9:30 AM","11:30 AM"],["11:50 AM","1:50 PM"]],
    Saturday: [],
    Sunday: []
  }
};

function emptyOverrides() {
  const o = {};
  DAYS.forEach(d => (o[d] = {}));
  return o;
}

function toMinutes(t) {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

const DAY_START = 9 * 60;
const DAY_END = 21 * 60;
const FIVE_PM = 17 * 60;

const SLOTS = [
  { start: "9:30 AM", end: "11:30 AM" },
  { start: "11:50 AM", end: "1:50 PM" },
  { start: "2:50 PM", end: "4:50 PM" }
];

function overlapsSlot(block, slot) {
  const bs = toMinutes(block[0]);
  const be = toMinutes(block[1]);
  const ss = toMinutes(slot.start);
  const se = toMinutes(slot.end);
  return bs < se && be > ss;
}

function blockToChips(block) {
  const covered = SLOTS.filter(slot => overlapsSlot(block, slot));
  return covered.length > 0 ? covered.map(s => [s.start, s.end]) : [block];
}

const STORE_KEY = "squad-timetable-v2";

export default function App() {
  const [people, setPeople] = useState(DEFAULT_BASE);
  const [overrides, setOverrides] = useState(emptyOverrides());
  const [editingDay, setEditingDay] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [openDay, setOpenDay] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const [hoverDay, setHoverDay] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [newBlock, setNewBlock] = useState({ start: "", end: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.people) setPeople(parsed.people);
        if (parsed.overrides) setOverrides(parsed.overrides);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ people, overrides }));
    } catch (e) {}
  }, [people, overrides, loaded]);

  const personIds = Object.keys(people);

  function dayFree(day) {
    return personIds.every(pid => overrides[day][pid] || people[pid][day].length === 0);
  }

  function toggleCancel(day, pid) {
    setOverrides(prev => {
      const next = { ...prev, [day]: { ...prev[day], [pid]: !prev[day][pid] } };
      if (!prev[day][pid]) {
        const willBeFree = personIds.every(id =>
          id === pid ? true : next[day][id] || people[id][day].length === 0
        );
        if (willBeFree) {
          setCelebrate(day);
          setTimeout(() => setCelebrate(null), 2200);
        }
      }
      return next;
    });
  }

  function resetOverrides() {
    setOverrides(emptyOverrides());
  }

  function resetPersonDay(pid, day) {
    setPeople(prev => ({
      ...prev,
      [pid]: { ...prev[pid], [day]: DEFAULT_BASE[pid][day] }
    }));
  }

  function removeBlock(pid, day, idx) {
    setPeople(prev => {
      const next = { ...prev };
      next[pid] = { ...next[pid] };
      next[pid][day] = next[pid][day].filter((_, i) => i !== idx);
      return next;
    });
  }

  function addBlock(pid, day) {
    if (!newBlock.start || !newBlock.end) return;
    setPeople(prev => {
      const next = { ...prev };
      next[pid] = { ...next[pid] };
      next[pid][day] = [...next[pid][day], [newBlock.start, newBlock.end]];
      return next;
    });
    setNewBlock({ start: "", end: "" });
    setEditingDay(null);
    setEditingPerson(null);
  }

  const weekendFree = ["Saturday", "Sunday"].map(d => ({ day: d, free: dayFree(d) }));
  const anyWeekendFree = weekendFree.some(w => w.free);
  const freeCount = DAYS.filter(d => dayFree(d)).length;

  return (
    <div style={{ padding: "0.5rem 0 1rem", maxWidth: 680 }}>

      <div style={{
        position: "relative",
        borderRadius: 16,
        padding: "1.75rem 1.75rem 1.5rem",
        marginBottom: "1.5rem",
        background: "linear-gradient(180deg, #FAEEDA 0%, #F4DCAE 100%)",
        overflow: "hidden",
        boxShadow: "0 10px 28px rgba(65,36,2,0.14)"
      }}>
        <div style={{
          position: "absolute", top: -30, right: -20, width: 140, height: 140,
          borderRadius: "50%", background: "rgba(255,255,255,0.25)"
        }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, background: "#412402",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            boxShadow: "0 4px 10px rgba(65,36,2,0.35)"
          }}>
            <Beer size={24} color="#FAEEDA" strokeWidth={1.75} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-voice)", fontSize: 26, fontWeight: 500, color: "#412402" }}>
              Are you free this weekend?
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#854F0B" }}>
              Four schedules, one shared answer.
            </p>
          </div>
        </div>

        <div style={{
          position: "relative", marginTop: "1.25rem", display: "flex", alignItems: "center", gap: 14,
          background: "rgba(255,255,255,0.55)", borderRadius: 12, padding: "0.85rem 1rem"
        }}>
          {anyWeekendFree ? (
            <PartyPopper size={22} color="#3B6D11" style={{ flexShrink: 0 }} />
          ) : (
            <Beer size={22} color="#854F0B" style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 14, color: anyWeekendFree ? "#27500A" : "#633806", lineHeight: 1.5 }}>
            {anyWeekendFree
              ? <><b style={{ fontWeight: 500 }}>It's on.</b> {weekendFree.filter(w => w.free).map(w => w.day).join(" and ")} works for all four of you.</>
              : "Weekend's not locked in yet — clear a class below to make it happen."}
          </span>
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: 10, marginBottom: "1.75rem"
      }}>
        {personIds.map(pid => {
          const c = PERSON_COLORS[pid];
          return (
            <div
              key={pid}
              style={{
                background: c.soft, borderRadius: 12,
                padding: "0.7rem 0.85rem", borderLeft: `3px solid ${c.fill}`,
                boxShadow: "0 1px 3px rgba(27,27,31,0.06)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                cursor: "default"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 14px rgba(27,27,31,0.12)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(27,27,31,0.06)";
              }}
            >
              <p style={{ fontWeight: 500, fontSize: 14, margin: 0, color: c.text }}>{people[pid].name}</p>
              <p style={{ fontSize: 12, margin: "1px 0 0", color: c.text, opacity: 0.7 }}>{people[pid].tag}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>This week</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            {freeCount} of 7 days fully open
          </p>
        </div>
        <button onClick={resetOverrides} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px" }}>
          <RotateCcw size={14} aria-hidden="true" />
          Reset week
        </button>
      </div>

      {DAYS.map(day => {
        const free = dayFree(day);
        const isOpen = openDay === day;
        const isCelebrating = celebrate === day;
        const isWeekend = day === "Saturday" || day === "Sunday";

        const isHovering = hoverDay === day;
        const cardShadow = isCelebrating
          ? "0 0 0 4px rgba(99,153,34,0.14), 0 10px 24px rgba(99,153,34,0.18)"
          : isHovering
          ? "0 8px 20px rgba(27,27,31,0.10)"
          : "0 1px 3px rgba(27,27,31,0.06)";

        return (
          <div
            key={day}
            onMouseEnter={() => setHoverDay(day)}
            onMouseLeave={() => setHoverDay(prev => (prev === day ? null : prev))}
            style={{
              background: "var(--surface-2)",
              border: isCelebrating ? "1.5px solid #639922" : "0.5px solid var(--border)",
              borderRadius: 12,
              marginBottom: 8,
              overflow: "hidden",
              boxShadow: cardShadow,
              transform: isCelebrating ? "scale(1.012)" : isHovering ? "translateY(-2px)" : "translateY(0)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.35s ease"
            }}
          >
            <div
              onClick={() => setOpenDay(isOpen ? null : day)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.8rem 1.1rem", cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: free ? "#639922" : "#B4B2A9", flexShrink: 0
                }} />
                <span style={{ fontWeight: 500, fontSize: 15 }}>{day}</span>
                {isWeekend && (
                  <span style={{ fontSize: 10, color: "#854F0B", background: "#FAEEDA", padding: "2px 7px", borderRadius: 6 }}>
                    weekend
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isCelebrating && <PartyPopper size={16} color="#3B6D11" style={{ animation: "popIn 0.5s ease" }} />}
                <span style={{ fontSize: 13, color: free ? "#3B6D11" : "var(--text-secondary)" }}>
                  {free ? "free all day" : "after 5 PM"}
                </span>
                <ChevronDown size={16} color="var(--text-muted)" style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease"
                }} />
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: "0.25rem 1.1rem 1rem", borderTop: "0.5px solid var(--border)" }}>
                {personIds.every(pid => people[pid][day].length === 0) && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0.75rem 0" }}>
                    Nobody has class this day. Free all day by default.
                  </p>
                )}

                {personIds.map(pid => {
                  const blocks = people[pid][day];
                  const cancelled = !!overrides[day][pid];
                  const isAdding = editingDay === day && editingPerson === pid;
                  const c = PERSON_COLORS[pid];

                  return (
                    <div key={pid} style={{ padding: "0.65rem 0", borderBottom: "0.5px dashed var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.fill }} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{people[pid].name}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {JSON.stringify(blocks) !== JSON.stringify(DEFAULT_BASE[pid][day]) && (
                            <button
                              onClick={() => resetPersonDay(pid, day)}
                              title="Reset this day's class times to default"
                              style={{ fontSize: 12, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <RotateCcw size={12} aria-hidden="true" />
                              reset
                            </button>
                          )}
                          {blocks.length > 0 && (
                            <button
                              onClick={() => toggleCancel(day, pid)}
                              style={{
                                fontSize: 12, padding: "4px 10px",
                                background: cancelled ? "#639922" : "transparent",
                                color: cancelled ? "#fff" : "var(--text-primary)",
                                borderColor: cancelled ? "#639922" : undefined
                              }}
                            >
                              {cancelled ? "cancelled" : "mark cancelled"}
                            </button>
                          )}
                        </div>
                      </div>

                      {blocks.length > 0 && (
                        <div style={{ marginBottom: 8, opacity: cancelled ? 0.35 : 1 }}>

                          {/* Time axis */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr) auto",
                              fontSize: 10,
                              color: "var(--text-muted)",
                              marginBottom: 4,
                              alignItems: "end"
                            }}
                          >
                            <div style={{ textAlign: "left" }}>9:30 AM</div>
                            <div style={{ textAlign: "center" }}>11:50 AM</div>
                            <div style={{ textAlign: "center" }}>2:50 PM</div>
                            <div style={{ width: 42, textAlign: "right" }}>5 PM</div>
                          </div>

                          {/* Timeline */}
                          <div
                            style={{
                              position: "relative",
                              height: 10,
                              display: "flex",
                              gap: 4
                            }}
                          >
                            {SLOTS.map((slot, i) => {
                              const busy = blocks.some(b => overlapsSlot(b, slot));
                              return (
                                <div
                                  key={i}
                                  style={{
                                    flex: 1,
                                    borderRadius: 4,
                                    background: busy ? c.fill : "var(--surface-1)",
                                    transition: "background 0.2s ease"
                                  }}
                                />
                              );
                            })}

                            <div
                              style={{
                                width: 2,
                                background: "var(--text-muted)",
                                opacity: 0.45,
                                marginLeft: 2
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {blocks.length === 0 && (
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>no fixed class</span>
                        )}
                        {blocks.flatMap((b, i) => {
                          const chips = blockToChips(b);

                          return chips.map((chip, j) => (
                            <span
                              key={`${i}-${j}`}
                              style={{
                                fontSize: 12,
                                padding: "3px 8px",
                                borderRadius: 6,
                                background: cancelled ? "var(--surface-1)" : c.soft,
                                color: cancelled ? "var(--text-muted)" : c.text,
                                textDecoration: cancelled ? "line-through" : "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              {chip[0]}–{chip[1]}
                              {j === chips.length - 1 && (
                                <X
                                  size={12}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => removeBlock(pid, day, i)}
                                  aria-label="Remove class block"
                                />
                              )}
                            </span>
                          ));
                        })}

                        {isAdding ? (
                          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <select
                              value={newBlock.start && newBlock.end ? `${newBlock.start}|${newBlock.end}` : ""}
                              onChange={e => {
                                const [start, end] = e.target.value.split("|");
                                setNewBlock({ start, end });
                              }}
                              style={{ height: 30, fontSize: 12, borderRadius: 6, padding: "0 8px" }}
                            >
                              <option value="">Select slot</option>
                              {SLOTS.filter(slot => !blocks.some(b => overlapsSlot(b, slot))).map(slot => (
                                <option key={slot.start} value={`${slot.start}|${slot.end}`}>
                                  {slot.start}–{slot.end}
                                </option>
                              ))}
                            </select>

                            <button onClick={() => addBlock(pid, day)} style={{ fontSize: 12, padding: "4px 8px" }}>add</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => { setEditingDay(day); setEditingPerson(pid); setNewBlock({ start: "", end: "" }); }}
                            style={{ fontSize: 12, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <Plus size={12} aria-hidden="true" />
                            class
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div style={{
                  marginTop: 10, padding: "0.6rem 0.8rem", fontSize: 13, borderRadius: 8,
                  background: free ? "#EAF3DE" : "var(--surface-1)",
                  color: free ? "#27500A" : "var(--text-secondary)"
                }}>
                  {free ? "Everyone's free all day — plan whenever." : "Default window: after 5:00 PM, everyone's free by then."}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(8deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
