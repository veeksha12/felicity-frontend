import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle, XCircle, AlertCircle, Download, ClipboardList, Search, UserCheck, UserX } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QRScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Tab: 'scanner' | 'manual'
  const [activeTab, setActiveTab] = useState('scanner');

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  // Dashboard / participant state
  const [stats, setStats] = useState({ total: 0, attended: 0, notAttended: 0 });
  const [scanHistory, setScanHistory] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Manual entry state
  const [manualSearch, setManualSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    loadDashboard();
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(console.error);
      }
    };
  }, [eventId]);

  const authHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const loadDashboard = async () => {
    try {
      setLoadingParticipants(true);
      const response = await fetch(`${API_BASE}/attendance/dashboard/${eventId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to load dashboard');
      const data = await response.json();
      setStats({
        total: data.summary.totalRegistrations,
        attended: data.summary.attended,
        notAttended: data.summary.notAttended
      });
      setScanHistory(data.recentScans || []);
      setParticipants(data.participants || []);
    } catch (error) {
      console.error('Load dashboard error:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoadingParticipants(false);
    }
  };

  // ---------- QR Scanner ----------
  const startScanning = () => {
    setScanning(true);
    setTimeout(() => {
      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      html5QrcodeScannerRef.current.render(onScanSuccess, onScanError);
    }, 100);
  };

  const stopScanning = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(console.error);
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    try {
      stopScanning();
      const response = await fetch(`${API_BASE}/attendance/scan`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ qrData: decodedText, eventId })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setLastScan({ success: true, message: data.message, participant: data.registration.participant.name, ticketId: data.registration.ticketId, time: new Date() });
        toast.success(`✓ ${data.registration.participant.name}`);
        setStats(prev => ({ ...prev, attended: prev.attended + 1, notAttended: prev.notAttended - 1 }));
        setScanHistory(prev => [{ ticketId: data.registration.ticketId, participantName: data.registration.participant.name, attendanceTime: new Date(), manualOverride: null }, ...prev.slice(0, 9)]);
        // Refresh participant list to reflect new state
        loadDashboard();
      } else {
        const isDuplicate = data.duplicate || data.message?.toLowerCase().includes('already');
        setLastScan({ success: false, message: data.message, duplicate: isDuplicate, participant: data.participant?.name, time: new Date() });
        if (isDuplicate) {
          toast(`Already scanned: ${data.participant?.name || 'This participant'}`, { icon: '⚠️', style: { background: '#fbbf24', color: '#000' } });
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to process QR code');
      stopScanning();
    }
  };

  const onScanError = (error) => {
    if (!error.includes('NotFoundException')) console.error('QR Scan error:', error);
  };

  // ---------- Manual Entry ----------
  const toggleAttendance = async (participant) => {
    const action = participant.attendanceMarked ? 'unmark' : 'mark';
    setTogglingId(participant._id);
    try {
      const response = await fetch(`${API_BASE}/attendance/manual`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          registrationId: participant._id,
          eventId,
          action,
          reason: 'Manual entry by organizer'
        })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`${action === 'mark' ? '✓ Marked' : '↩ Unmarked'}: ${participant.participant.name}`);
        // Update local participant state immediately for snappy UX
        setParticipants(prev => prev.map(p =>
          p._id === participant._id
            ? { ...p, attendanceMarked: action === 'mark', status: action === 'mark' ? 'Attended' : 'Confirmed', attendanceTime: action === 'mark' ? new Date() : null }
            : p
        ));
        setStats(prev => ({
          ...prev,
          attended: action === 'mark' ? prev.attended + 1 : prev.attended - 1,
          notAttended: action === 'mark' ? prev.notAttended - 1 : prev.notAttended + 1
        }));
      } else {
        toast.error(data.message || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Manual attendance error:', error);
      toast.error('Failed to update attendance');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredParticipants = participants.filter(p => {
    const q = manualSearch.toLowerCase();
    return !q || p.participant.name.toLowerCase().includes(q) || p.ticketId?.toLowerCase().includes(q) || p.participant.email?.toLowerCase().includes(q);
  });

  // ---------- Export ----------
  const exportAttendance = async () => {
    try {
      const response = await fetch(`${API_BASE}/attendance/export/${eventId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_${eventId}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Attendance exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export attendance');
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <button onClick={() => navigate('/organizer')} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-display text-gradient">Attendance</h1>
          <button onClick={exportAttendance} className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-sm">
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-disco-purple to-disco-pink rounded-lg p-4">
            <p className="text-white/80 text-sm mb-1">Total</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4">
            <p className="text-white/80 text-sm mb-1">Attended</p>
            <p className="text-3xl font-bold">{stats.attended}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg p-4">
            <p className="text-white/80 text-sm mb-1">Pending</p>
            <p className="text-3xl font-bold">{stats.notAttended}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'scanner' ? 'bg-disco-pink text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            <Camera size={16} />
            QR Scanner
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-disco-pink text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            <ClipboardList size={16} />
            Manual Entry
          </button>
        </div>

        {/* ===== QR SCANNER TAB ===== */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-glass border border-white/10 rounded-2xl p-6">
                {!scanning ? (
                  <div className="text-center py-12">
                    <Camera className="mx-auto mb-4 text-disco-pink" size={64} />
                    <h3 className="text-2xl font-display mb-4">Ready to Scan</h3>
                    <p className="text-gray-400 mb-2">Click below to start scanning QR codes</p>
                    <p className="text-sm text-yellow-400 mb-6">ℹ️ Scanner stops after each successful scan</p>
                    <button onClick={startScanning} className="btn-retro py-3 px-8">
                      Start Scanning
                    </button>
                  </div>
                ) : (
                  <div>
                    <div id="qr-reader" ref={scannerRef} className="rounded-lg overflow-hidden mb-4" />
                    <button onClick={stopScanning} className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                      Stop Scanning
                    </button>
                  </div>
                )}
              </div>

              {/* Last Scan Result */}
              {lastScan && (
                <div className={`border rounded-lg p-6 ${lastScan.success ? 'bg-green-500/10 border-green-500/30' : lastScan.duplicate ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-start gap-4">
                    {lastScan.success ? <CheckCircle className="text-green-400 flex-shrink-0" size={24} /> : lastScan.duplicate ? <AlertCircle className="text-yellow-400 flex-shrink-0" size={24} /> : <XCircle className="text-red-400 flex-shrink-0" size={24} />}
                    <div className="flex-1">
                      <h4 className={`font-bold mb-1 ${lastScan.success ? 'text-green-400' : lastScan.duplicate ? 'text-yellow-400' : 'text-red-400'}`}>
                        {lastScan.success ? 'Success!' : lastScan.duplicate ? 'Already Scanned' : 'Error'}
                      </h4>
                      <p className="text-sm mb-2">{lastScan.message}</p>
                      {lastScan.participant && <p className="text-sm text-gray-400">Participant: <span className="text-white">{lastScan.participant}</span></p>}
                      {lastScan.ticketId && <p className="text-sm text-gray-400">Ticket: <span className="font-mono text-disco-pink">{lastScan.ticketId}</span></p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Scans Sidebar */}
            <div className="space-y-6">
              <div className="bg-glass border border-white/10 rounded-2xl p-6">
                <h3 className="font-display text-lg mb-4">Recent Scans</h3>
                <div className="space-y-3">
                  {scanHistory.length > 0 ? (
                    scanHistory.map((scan, index) => (
                      <div key={index} className="bg-black/30 rounded-lg p-3 text-sm">
                        <p className="font-medium mb-1">{scan.participantName}</p>
                        <p className="text-xs text-gray-400 mb-1">{scan.ticketId}</p>
                        <p className="text-xs text-gray-500">{new Date(scan.attendanceTime).toLocaleTimeString()}</p>
                        {scan.manualOverride && (
                          <div className="mt-2 flex items-center gap-1 text-yellow-400">
                            <AlertCircle size={12} />
                            <span className="text-xs">Manual override</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-6">No scans yet</p>
                  )}
                </div>
              </div>
              <div className="bg-disco-pink/10 border border-disco-pink/30 rounded-lg p-4">
                <h4 className="font-medium text-disco-pink mb-2 flex items-center gap-2"><AlertCircle size={18} />Tips</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Ensure good lighting for scanning</li>
                  <li>• Hold QR code steady</li>
                  <li>• Switch to Manual Entry tab if camera fails</li>
                  <li>• Export data regularly</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ===== MANUAL ENTRY TAB ===== */}
        {activeTab === 'manual' && (
          <div className="bg-glass border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-display mb-1">Manual Attendance</h2>
                <p className="text-sm text-gray-400">Search and mark/unmark attendance for each participant</p>
              </div>
              <button onClick={loadDashboard} className="text-xs text-disco-pink hover:underline">
                Refresh
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, ticket ID, or email…"
                value={manualSearch}
                onChange={e => setManualSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
              />
            </div>

            {loadingParticipants ? (
              <div className="text-center py-16 text-gray-400">Loading participants…</div>
            ) : filteredParticipants.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                {manualSearch ? 'No participants match your search' : 'No registrations found'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filteredParticipants.map(p => (
                  <div
                    key={p._id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${p.attendanceMarked
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${p.attendanceMarked ? 'bg-green-500/25 text-green-400' : 'bg-disco-pink/20 text-disco-pink'}`}>
                        {p.participant.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.participant.name}</p>
                        <p className="text-xs text-gray-400 truncate">{p.participant.email}</p>
                        {p.ticketId && <p className="text-xs font-mono text-gray-500">{p.ticketId}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {p.attendanceMarked && p.attendanceTime && (
                        <span className="text-xs text-green-400 hidden sm:block">
                          {new Date(p.attendanceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <button
                        onClick={() => toggleAttendance(p)}
                        disabled={togglingId === p._id}
                        title={p.attendanceMarked ? 'Unmark attendance' : 'Mark as attended'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${p.attendanceMarked
                            ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400 border border-green-500/30 hover:border-red-500/30'
                            : 'bg-disco-pink/20 text-disco-pink hover:bg-disco-pink/30 border border-disco-pink/30'
                          }`}
                      >
                        {togglingId === p._id ? (
                          <span>…</span>
                        ) : p.attendanceMarked ? (
                          <><UserCheck size={14} /> Attended</>
                        ) : (
                          <><UserX size={14} /> Mark</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;