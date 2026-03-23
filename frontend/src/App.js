import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const API = 'http://127.0.0.1:5000/api';

export default function App() {
  const [intent, setIntent] = useState('');
  const [policies, setPolicies] = useState([]);
  const [topology, setTopology] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkTarget, setCheckTarget] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [time, setTime] = useState('');
  const [activeTab, setActiveTab] = useState('intent');
  const [selectedDevice, setSelectedDevice] = useState('ALL');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [missionLog, setMissionLog] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    fetchPolicies();
    fetchTopology();
    addLog('SYSTEM', 'IBN Engine initialized');
    addLog('SYSTEM', 'Policy parser ready');
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [missionLog]);

  const addLog = (type, msg) => {
    const now = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setMissionLog(prev => [...prev.slice(-49), { time: now, type, msg }]);
  };

  const fetchPolicies = async () => {
    try { const res = await axios.get(`${API}/policies`); setPolicies(res.data); }
    catch { addLog('ERROR', 'Failed to fetch policies'); }
  };

  const fetchTopology = async () => {
    try { const res = await axios.get(`${API}/topology`); setTopology(res.data); }
    catch {}
  };

  const handleSubmitIntent = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    addLog('INPUT', `"${intent}"`);
    try {
      const payload = { intent };
      if (selectedDevice !== 'ALL') payload.device = selectedDevice;
      if (scheduleStart) payload.schedule_start = scheduleStart;
      if (scheduleEnd) payload.schedule_end = scheduleEnd;
      const res = await axios.post(`${API}/intent`, payload);
      toast.success(`Policy created: ${res.data.policy.description}`);
      addLog('SUCCESS', `${res.data.policy.id} — ${res.data.policy.description}`);
      setIntent(''); setScheduleStart(''); setScheduleEnd('');
      fetchPolicies();
    } catch {
      toast.error('Failed to parse intent.');
      addLog('ERROR', 'Intent parsing failed');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/policies/${id}`);
    toast.info(`Policy ${id} deleted`);
    addLog('DELETE', `${id} removed`);
    fetchPolicies();
  };

  const handleCheck = async () => {
    if (!checkTarget.trim()) return;
    try {
      const res = await axios.post(`${API}/check`, { target: checkTarget });
      setCheckResult(res.data);
      addLog(res.data.allowed ? 'ALLOW' : 'BLOCK', `${checkTarget} → ${res.data.allowed ? 'ALLOWED' : 'BLOCKED'}`);
    } catch {}
  };

  const exportPolicies = () => {
    const lines = [
      'IBN ENGINE — POLICY EXPORT',
      `Generated: ${new Date().toLocaleString()}`,
      '='.repeat(50),
      '',
      ...policies.map(p =>
        `[${p.id.toUpperCase()}]\nAction: ${p.action} | Target: ${p.target}\nTime: ${p.time_start && p.time_end ? `${p.time_start}–${p.time_end}` : 'Always'} | Priority: ${p.priority}\nDesc: ${p.description}\nCreated: ${p.created_at}\n${'-'.repeat(40)}`
      )
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ibn_policies.txt';
    a.click();
    toast.success('Policies exported!');
    addLog('SYSTEM', `Exported ${policies.length} policies`);
  };

  const blockCount  = policies.filter(p => p.action === 'block').length;
  const allowCount  = policies.filter(p => p.action === 'allow').length;
  const limitCount  = policies.filter(p => p.action === 'limit').length;
  const highCount   = policies.filter(p => p.priority === 'high').length;
  const totalCount  = policies.length;
  const devices     = topology ? ['ALL', ...topology.devices.map(d => d.name)] : ['ALL'];

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-dot" />
          <div>
            <div className="brand-name">IBN ENGINE</div>
            <div className="brand-sub">Intent-Based Networking · Next Generation Networks</div>
          </div>
        </div>
        <div className="header-meta">
          <div className="meta-chip online">● ONLINE</div>
          <div className="meta-chip">{totalCount} POLICIES</div>
          <div className="clock">{time}</div>
        </div>
      </header>

      <div className="top-bar" />

      <div className="layout">

        {/* LEFT */}
        <aside className="sidebar">

          {/* Tabs */}
          <div className="tab-row">
            {[['intent','Command'],['inspect','Inspect'],['topology','Topology']].map(([k,l]) => (
              <button key={k} className={`tab-btn ${activeTab===k?'active':''}`} onClick={() => setActiveTab(k)}>{l}</button>
            ))}
          </div>

          {/* COMMAND */}
          {activeTab === 'intent' && (
            <div className="card">
              <div className="card-header">Network Intent</div>
              <div className="card-body">
                <label className="lbl">Plain English Command</label>
                <textarea className="field" rows={3} value={intent}
                  onChange={e => setIntent(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSubmitIntent();}}}
                  placeholder="e.g. Block YouTube between 9am and 5pm" />

                <label className="lbl">Target Device</label>
                <select className="field select" value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
                  {devices.map(d => <option key={d}>{d}</option>)}
                </select>

                <div className="two-col">
                  <div>
                    <label className="lbl">Start Time</label>
                    <input type="time" className="field" value={scheduleStart} onChange={e => setScheduleStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="lbl">End Time</label>
                    <input type="time" className="field" value={scheduleEnd} onChange={e => setScheduleEnd(e.target.value)} />
                  </div>
                </div>

                <button className="btn primary" onClick={handleSubmitIntent} disabled={loading}>
                  {loading ? <><span className="spin"/>Processing...</> : 'Apply Intent'}
                </button>
              </div>
            </div>
          )}

          {/* INSPECT */}
          {activeTab === 'inspect' && (
            <div className="card">
              <div className="card-header">Traffic Inspector</div>
              <div className="card-body">
                <label className="lbl">Target Host</label>
                <input className="field" value={checkTarget}
                  onChange={e => setCheckTarget(e.target.value)}
                  onKeyDown={e => e.key==='Enter'&&handleCheck()}
                  placeholder="e.g. youtube.com" />
                <button className="btn secondary" onClick={handleCheck}>Run Inspection</button>
                {checkResult && (
                  <div className={`result-box ${checkResult.allowed?'allowed':'blocked'}`}>
                    <div className="result-status">{checkResult.allowed ? '✓ Allowed' : '✕ Blocked'}</div>
                    <div className="result-desc">{checkResult.description}</div>
                    {checkResult.matched_policy && <div className="result-ref">Ref: {checkResult.matched_policy}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TOPOLOGY */}
          {activeTab === 'topology' && (
            <div className="card">
              <div className="card-header">Network Topology</div>
              <div className="card-body">
                {topology && topology.devices.map((d,i) => (
                  <div key={d.id} className="node-row">
                    <div className="node-pulse" />
                    <div className="node-info">
                      <div className="node-name">{d.name}</div>
                      <div className="node-ip">{d.ip}</div>
                    </div>
                    <div className="node-tag">{i===3?'Server':i===2?'IoT':'Client'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOG */}
          <div className="card log-card">
            <div className="card-header">Activity Log</div>
            <div className="log-scroll" ref={logRef}>
              {missionLog.map((l,i) => (
                <div key={i} className="log-line">
                  <span className="log-t">{l.time}</span>
                  <span className={`log-badge lb-${l.type.toLowerCase()}`}>{l.type}</span>
                  <span className="log-m">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* MAIN */}
        <main className="main">

          {/* Stats */}
          <div className="stats-row">
            {[
              {n:totalCount, l:'Total Policies',  c:'blue'},
              {n:blockCount, l:'Blocked',          c:'red'},
              {n:allowCount, l:'Allowed',           c:'green'},
              {n:limitCount, l:'Limited',           c:'amber'},
            ].map(s => (
              <div key={s.l} className={`stat-box stat-${s.c}`}>
                <div className="stat-n">{s.n}</div>
                <div className="stat-l">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {totalCount > 0 && (
            <div className="card chart-card">
              <div className="card-header">Policy Analytics</div>
              <div className="card-body">
                {[
                  {label:'Block',    val:blockCount, cls:'bar-red'},
                  {label:'Allow',    val:allowCount, cls:'bar-green'},
                  {label:'Limit',    val:limitCount, cls:'bar-amber'},
                  {label:'High Pri', val:highCount,  cls:'bar-blue'},
                ].map(b => (
                  <div key={b.label} className="bar-row">
                    <div className="bar-lbl">{b.label}</div>
                    <div className="bar-track">
                      <div className={`bar-fill ${b.cls}`}
                        style={{width:`${totalCount?(b.val/totalCount)*100:0}%`}} />
                    </div>
                    <div className="bar-num">{b.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies */}
          <div className="card policies-card">
            <div className="card-header-row">
              <div className="card-header">Active Policies</div>
              <div className="header-actions">
                <span className="count-chip">{totalCount} active</span>
                {totalCount > 0 && <button className="export-btn" onClick={exportPolicies}>↓ Export</button>}
              </div>
            </div>

            {policies.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">◎</div>
                <div className="empty-title">No policies yet</div>
                <div className="empty-sub">Submit an intent to create your first policy</div>
              </div>
            ) : (
              <div className="policy-list">
                {policies.map(p => (
                  <div key={p.id} className={`policy-item pi-${p.action}`}>
                    <div className="pi-top">
                      <div className="pi-left">
                        <span className="pi-id">{p.id}</span>
                        {p.device && p.device !== 'ALL' && <span className="pi-device">{p.device}</span>}
                      </div>
                      <div className="pi-right">
                        <span className={`pi-action pa-${p.action}`}>{p.action}</span>
                        <span className={`pi-pri pp-${p.priority}`}>{p.priority}</span>
                        <button className="pi-del" onClick={() => handleDelete(p.id)}>✕</button>
                      </div>
                    </div>
                    <div className="pi-target">{p.target}</div>
                    <div className="pi-row">
                      <span className="pi-chip">⏱ {p.time_start&&p.time_end?`${p.time_start}–${p.time_end}`:'Always active'}</span>
                      <span className="pi-chip">{p.description}</span>
                    </div>
                    <div className="pi-footer">
                      Created {p.created_at}
                      {p.firewall && <span className={`pi-fw ${p.firewall==='ENFORCED'?'fw-on':'fw-off'}`}>{p.firewall==='ENFORCED'?'● Enforced':'○ Simulated'}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

      <footer className="footer">
        <span>IBN Engine · Next Generation Networks Project</span>
        <span>Policies: {totalCount} · Blocked: {blockCount} · Status: Operational</span>
      </footer>

      <ToastContainer theme="light" position="bottom-right"
        toastStyle={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', borderRadius: '8px' }} />
    </div>
  );
}