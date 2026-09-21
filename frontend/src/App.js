import React, { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'web_studio'
  
  // ==========================================
  // Chat State
  // ==========================================
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am NEXIUM AI, accelerated by a native Rust engine. How can I help you today?',
      thinking: null,
      tools: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('smart'); // 'smart' | 'fast'
  const [persona, setPersona] = useState('general'); // 'general' | 'architect' | 'web_architect' | 'math_logic'
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // ==========================================
  // Web Audio Holographic Sound Synthesizer
  // ==========================================
  const playSciFiSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      if (type === 'wake') {
        // Dual harmonic frequency sweep (880Hz to 1760Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'gesture') {
        // High-tech tactile acknowledgement blip (1200Hz -> 1600Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1600, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'pulse') {
        // Sub-bass energy transmission pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'alert') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(400, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch (e) {
      // AudioContext auto-play restriction fallback
    }
  };

  // ==========================================
  // Voice Synthesis & Recognition State
  // ==========================================
  const [isListening, setIsListening] = useState(false);
  const [autoNarrate, setAutoNarrate] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [wakeStatus, setWakeStatus] = useState('Standby');
  const recognitionRef = useRef(null);
  const wakeRecognitionRef = useRef(null);

  // ==========================================
  // Hand Gesture Vision Core State
  // ==========================================
  const [visionEnabled, setVisionEnabled] = useState(false);
  const [lastGesture, setLastGesture] = useState(null);
  const [gestureFeedback, setGestureFeedback] = useState('Tracking Centroid');
  const [visionFps, setVisionFps] = useState(30);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const visionStreamRef = useRef(null);
  const gestureCooldownRef = useRef(0);

  // ==========================================
  // Heavy Rust Supercomputer & Micro-Thinking State
  // ==========================================
  const [supercomputerOpen, setSupercomputerOpen] = useState(false);
  const [supercomputerData, setSupercomputerData] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);

  const fetchSupercomputerStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/supercomputer/status`);
      if (res.ok) {
        const data = await res.json();
        setSupercomputerData(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error('Failed to fetch supercomputer status:', e);
    }
  };

  const handleRunSupercomputerBenchmark = async () => {
    setBenchmarking(true);
    playSciFiSound('pulse');
    try {
      const res = await fetch(`${API_BASE}/api/supercomputer/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix_dim: 256, iterations: 3 })
      });
      if (res.ok) {
        const data = await res.json();
        playSciFiSound('gesture');
        setSupercomputerData(prev => ({ ...prev, benchmark: data.benchmark }));
      }
    } catch (e) {
      console.error('Benchmark failed:', e);
    } finally {
      setBenchmarking(false);
    }
  };

  // ==========================================
  // Emotion Core & Feelings Journal State
  // ==========================================
  const [emotionOpen, setEmotionOpen] = useState(false);
  const [activeEmotion, setActiveEmotion] = useState({
    primary: 'High Anticipation & Eager Hope',
    valence: 0.85,
    arousal: 0.80,
    intensity: 0.90,
    empathy_score: 0.98
  });
  const [emotionJournal, setEmotionJournal] = useState([]);

  const fetchEmotionJournal = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/emotion/history?limit=8`);
      if (res.ok) {
        const data = await res.json();
        setEmotionJournal(data.history || []);
        if (data.current && data.current.current_feeling) {
          setActiveEmotion(data.current.current_feeling);
        }
      }
    } catch (e) {
      console.error('Failed to fetch emotion journal:', e);
    }
  };

  // ==========================================
  // AI Neurons & Synaptic Mesh State
  // ==========================================
  const [neuralOpen, setNeuralOpen] = useState(false);
  const [neuralData, setNeuralData] = useState({
    total_neurons: 4096,
    num_layers: 4,
    neurons_per_layer: 1024,
    latest_telemetry: {
      total_neurons: 4096,
      active_firing_neurons: 582,
      firing_rate_pct: 14.2,
      latency_ms: 0.42,
      layers: [
        { layer_idx: 0, layer_name: 'L1-Input-Embedding', active_neurons: 512, layer_firing_rate: 50.0 },
        { layer_idx: 1, layer_name: 'L2-SwiGLU-Projection', active_neurons: 640, layer_firing_rate: 62.5 },
        { layer_idx: 2, layer_name: 'L3-Recurrent-Attractor', active_neurons: 580, layer_firing_rate: 56.6 },
        { layer_idx: 3, layer_name: 'L4-Output-Synaptic', active_neurons: 596, layer_firing_rate: 58.2 },
      ]
    }
  });
  const [firingSynapses, setFiringSynapses] = useState(false);

  const fetchNeuralStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/neural/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.network_topology) {
          setNeuralData(data.network_topology);
        }
      }
    } catch (e) {
      console.error('Failed to fetch neural status:', e);
    }
  };

  const handleFireSynapses = async () => {
    setFiringSynapses(true);
    playSciFiSound('pulse');
    try {
      const res = await fetch(`${API_BASE}/api/neural/fire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stimulus_text: "Manual Synaptic Excitation Burst", stimulus_intensity: 1.5 })
      });
      if (res.ok) {
        const data = await res.json();
        playSciFiSound('gesture');
        setNeuralData(prev => ({
          ...prev,
          latest_telemetry: data.firing || data.telemetry
        }));
      }
    } catch (e) {
      console.error('Neural firing failed:', e);
    } finally {
      setFiringSynapses(false);
    }
  };

  useEffect(() => {
    fetchSupercomputerStatus();
    fetchEmotionJournal();
    fetchNeuralStatus();
  }, []);

  const speakText = (text, idx = null) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }
    if (speakingIdx === idx && idx !== null) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setSpeakingIdx(idx);
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please try Chrome, Edge, or Brave.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition init error:', err);
      setIsListening(false);
    }
  };

  // Ambient Hotword / Wake-Word Detection ("Nexium...")
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !wakeWordActive) {
      wakeRecognitionRef.current?.stop();
      setWakeStatus('Standby');
      return;
    }

    let isRunning = true;
    const startWakeListener = () => {
      if (!isRunning) return;
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => setWakeStatus("Listening for 'Nexium'...");
        rec.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const phrase = event.results[i][0].transcript.trim();
              const match = phrase.match(/(?:hey\s+)?nexium[\s,:-]*(.*)/i);
              if (match) {
                playSciFiSound('wake');
                const command = match[1].trim();
                setWakeStatus("✨ 'Nexium' Hotword Detected!");
                if (command) {
                  handleSend(null, command);
                } else {
                  const reply = "NEXIUM core online and listening, Commander. All systems optimal. How can I assist you?";
                  setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
                  speakText(reply);
                }
                setTimeout(() => setWakeStatus("Listening for 'Nexium'..."), 2500);
              }
            }
          }
        };
        rec.onerror = () => {};
        rec.onend = () => {
          if (isRunning && wakeWordActive) {
            setTimeout(startWakeListener, 400);
          }
        };
        wakeRecognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn('Wake word error:', err);
      }
    };

    startWakeListener();

    return () => {
      isRunning = false;
      wakeRecognitionRef.current?.stop();
    };
  }, [wakeWordActive]);

  // Webcam Hand Gesture Vision Loop
  useEffect(() => {
    if (!visionEnabled) {
      if (visionStreamRef.current) {
        visionStreamRef.current.getTracks().forEach(track => track.stop());
        visionStreamRef.current = null;
      }
      setLastGesture(null);
      return;
    }

    let isRunning = true;
    let prevFrame = null;
    let prevCentroid = null;
    let waveOscillations = 0;
    let lastSign = 0;

    navigator.mediaDevices?.getUserMedia({ video: { width: 320, height: 240 } })
      .then(stream => {
        if (!isRunning) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        visionStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const width = 96;
        const height = 72;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const processFrame = () => {
          if (!isRunning || !visionEnabled || !videoRef.current) return;

          try {
            ctx.drawImage(videoRef.current, 0, 0, width, height);
            const frame = ctx.getImageData(0, 0, width, height);
            const cur = frame.data;

            if (prevFrame) {
              let motionPixels = 0;
              let sumX = 0;
              let sumY = 0;

              for (let i = 0; i < cur.length; i += 4) {
                const diff = (
                  Math.abs(cur[i] - prevFrame[i]) +
                  Math.abs(cur[i + 1] - prevFrame[i + 1]) +
                  Math.abs(cur[i + 2] - prevFrame[i + 2])
                ) / 3;

                if (diff > 26) {
                  const pixelIdx = i / 4;
                  const x = pixelIdx % width;
                  const y = Math.floor(pixelIdx / width);
                  motionPixels++;
                  sumX += x;
                  sumY += y;
                }
              }

              const now = Date.now();
              if (motionPixels > 110 && now > gestureCooldownRef.current) {
                const cx = sumX / motionPixels;
                const cy = sumY / motionPixels;

                if (prevCentroid) {
                  const dx = cx - prevCentroid.x;
                  const dy = cy - prevCentroid.y;

                  // Wave detection (rapid alternating horizontal sign)
                  const curSign = Math.sign(dx);
                  if (Math.abs(dx) > 7 && curSign !== 0 && curSign !== lastSign) {
                    waveOscillations++;
                    lastSign = curSign;
                    if (waveOscillations >= 3) {
                      setLastGesture('👋 WAVE');
                      setGestureFeedback('Wake Greeting Triggered!');
                      playSciFiSound('wake');
                      const waveReply = "Greetings Commander! Hand wave detected. NEXIUM core is online and ready.";
                      setMessages(prev => [...prev, { role: 'assistant', content: waveReply }]);
                      speakText(waveReply);
                      waveOscillations = 0;
                      gestureCooldownRef.current = now + 2000;
                    }
                  }

                  // Swipe Left (User hand moves left on screen -> right-to-left vector)
                  if (dx < -16 && Math.abs(dy) < 14) {
                    setLastGesture('👉 SWIPE LEFT');
                    setGestureFeedback('Switched to Web Studio');
                    playSciFiSound('gesture');
                    setActiveTab('web_studio');
                    gestureCooldownRef.current = now + 1400;
                  }
                  // Swipe Right (User hand moves right on screen -> left-to-right vector)
                  else if (dx > 16 && Math.abs(dy) < 14) {
                    setLastGesture('👈 SWIPE RIGHT');
                    setGestureFeedback('Switched to Reasoning Chat');
                    playSciFiSound('gesture');
                    setActiveTab('chat');
                    gestureCooldownRef.current = now + 1400;
                  }
                  // Open Palm Hold (High motion area, almost zero displacement) -> Stop Voice
                  else if (motionPixels > 380 && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
                    setLastGesture('✋ OPEN PALM');
                    setGestureFeedback('Speech Narration Muted');
                    playSciFiSound('alert');
                    window.speechSynthesis?.cancel();
                    setSpeakingIdx(null);
                    gestureCooldownRef.current = now + 1500;
                  }
                  // Swipe Up -> Hardware Specs
                  else if (dy < -18 && Math.abs(dx) < 12) {
                    setLastGesture('👆 SWIPE UP');
                    setGestureFeedback('Inspecting Hardware Specs...');
                    playSciFiSound('gesture');
                    handleSend(null, "Run device task to inspect system specs, CPU, and RAM");
                    gestureCooldownRef.current = now + 2000;
                  }
                }
                prevCentroid = { x: cx, y: cy };
              } else if (motionPixels < 40) {
                waveOscillations = 0;
              }
            }
            prevFrame = cur;
          } catch (e) {}

          if (isRunning && visionEnabled) {
            setTimeout(processFrame, 40);
          }
        };

        processFrame();
      })
      .catch(err => {
        console.error('Camera access error:', err);
        setVisionEnabled(false);
        alert('Camera access denied or unavailable. Please grant camera permission to use Hand Gesture Vision.');
      });

    return () => {
      isRunning = false;
      if (visionStreamRef.current) {
        visionStreamRef.current.getTracks().forEach(t => t.stop());
        visionStreamRef.current = null;
      }
    };
  }, [visionEnabled]);

  // ==========================================
  // Web Studio State
  // ==========================================
  const [siteTitle, setSiteTitle] = useState('Apex Cloud');
  const [siteTagline, setSiteTagline] = useState('High-performance serverless AI infrastructure with sub-microsecond latency.');
  const [siteTemplate, setSiteTemplate] = useState('saas_landing');
  const [siteTheme, setSiteTheme] = useState('cyber_violet');
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [generatedSite, setGeneratedSite] = useState(null);
  const [generatingWeb, setGeneratingWeb] = useState(false);
  const [rawHtmlModal, setRawHtmlModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, loading, activeTab]);

  // Initial demo site generation on mount if empty
  useEffect(() => {
    if (!generatedSite) {
      handleGenerateWebsite();
    }
  }, []);

  const handleSend = async (e, promptOverride = null) => {
    e?.preventDefault();
    const userPrompt = (promptOverride || input).trim();
    if (!userPrompt || loading) return;

    if (!promptOverride) setInput('');
    setLoading(true);

    const updatedMessages = [...messages, { role: 'user', content: userPrompt }];
    setMessages(updatedMessages);

    try {
      if (mode === 'smart') {
        const res = await fetch(`${API_BASE}/api/smart_chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            session_id: sessionId,
            persona: persona,
            enable_thinking: true,
            enable_tools: true,
            enable_critic: true,
            max_tokens: 512
          })
        });

        const data = await res.json();
        if (res.ok) {
          if (data.session_id) setSessionId(data.session_id);
          const replyText = data.text || 'No response generated.';

          if (data.emotion && data.emotion.feeling) {
            setActiveEmotion(data.emotion.feeling);
            fetchEmotionJournal();
          }
          if (data.neural_telemetry) {
            setNeuralData(prev => ({
              ...prev,
              latest_telemetry: data.neural_telemetry
            }));
          }

          setMessages([
            ...updatedMessages,
            {
              role: 'assistant',
              content: replyText,
              thinking: data.thinking,
              thinking_telemetry: data.thinking_telemetry,
              micro_thinking: data.micro_thinking,
              emotion: data.emotion,
              neural_telemetry: data.neural_telemetry,
              tools: data.tools_used || []
            }
          ]);
          if (autoNarrate && replyText) {
            speakText(replyText, updatedMessages.length);
          }
        } else {
          setMessages([
            ...updatedMessages,
            {
              role: 'assistant',
              content: `⚠️ Error (${res.status}): ${data.detail || data.error || 'Server error'}`
            }
          ]);
        }
      } else {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            max_tokens: 256
          })
        });

        const data = await res.json();
        if (res.ok) {
          const replyText = data.text || JSON.stringify(data);
          setMessages([
            ...updatedMessages,
            {
              role: 'assistant',
              content: replyText
            }
          ]);
          if (autoNarrate && replyText) {
            speakText(replyText, updatedMessages.length);
          }
        } else {
          setMessages([
            ...updatedMessages,
            {
              role: 'assistant',
              content: `⚠️ Error (${res.status}): ${data.detail || 'Server error'}`
            }
          ]);
        }
      }
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: `⚠️ Connection Error: Failed to connect to NEXIUM backend (${err.message})`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWebsite = async (preset = null) => {
    setGeneratingWeb(true);
    const title = preset?.title || siteTitle;
    const template = preset?.template || siteTemplate;
    const theme = preset?.theme || siteTheme;
    const tagline = preset?.tagline || siteTagline;

    if (preset) {
      setSiteTitle(title);
      setSiteTemplate(template);
      setSiteTheme(theme);
      setSiteTagline(tagline);
    }

    try {
      const res = await fetch(`${API_BASE}/api/web/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          template: template,
          theme: theme,
          tagline: tagline
        })
      });
      const data = await res.json();
      if (res.ok && data.site) {
        setGeneratedSite(data.site);
      }
    } catch (e) {
      console.error('Failed to generate website:', e);
    } finally {
      setGeneratingWeb(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!generatedSite) return;
    window.open(`${API_BASE}${generatedSite.preview_url}`, '_blank');
  };

  return (
    <div style={styles.container}>
      {/* Top Main Navigation Bar */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>
          <span style={styles.title}>NEXIUM AI</span>
          <span style={styles.logoBadge}>v1.0.0-TITAN • RUST SUPERCOMPUTER</span>
        </div>

        {/* Mode & Tab Switchers */}
        <div style={styles.tabGroup}>
          <button
            style={activeTab === 'chat' ? styles.tabActive : styles.tabInactive}
            onClick={() => setActiveTab('chat')}
          >
            💬 Reasoning Chat
          </button>
          <button
            style={activeTab === 'web_studio' ? styles.tabActive : styles.tabInactive}
            onClick={() => setActiveTab('web_studio')}
          >
            🌐 Autonomous Web Studio
          </button>
        </div>

        {activeTab === 'chat' && (
          <div style={styles.headerControls}>
            <div style={styles.controlGroup}>
              <span style={styles.label}>Mode:</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={styles.select}
              >
                <option value="smart">🧠 Deep Reasoning</option>
                <option value="fast">⚡ Fast Response</option>
              </select>
            </div>

            <div style={styles.controlGroup}>
              <span style={styles.label}>Persona:</span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                style={styles.select}
              >
                <option value="general">🤖 General Assistant</option>
                <option value="architect">🏛️ Software Architect</option>
                <option value="web_architect">🎨 Web Architect & UI Designer</option>
                <option value="math_logic">📐 Logic & Mathematics</option>
              </select>
            </div>

            <button
              onClick={() => {
                const next = !supercomputerOpen;
                setSupercomputerOpen(next);
                if (next) {
                  playSciFiSound('pulse');
                  fetchSupercomputerStatus();
                }
              }}
              style={supercomputerOpen ? styles.hudActiveBtn : styles.hudInactiveBtn}
              title="Toggle Rust Supercomputer Cluster HUD"
            >
              {supercomputerOpen ? '🖥️ Supercomputer: ON' : '🖥️ Supercomputer: OFF'}
            </button>

            <button
              onClick={() => {
                const next = !neuralOpen;
                setNeuralOpen(next);
                if (next) {
                  playSciFiSound('pulse');
                  fetchNeuralStatus();
                }
              }}
              style={neuralOpen ? styles.neuralActiveBtn : styles.hudInactiveBtn}
              title="Toggle 4,096 Synaptic AI Neurons Visualizer"
            >
              {neuralOpen ? '🧠 AI Neurons: ON' : '🧠 AI Neurons: OFF'}
            </button>

            <button
              onClick={() => {
                const next = !emotionOpen;
                setEmotionOpen(next);
                if (next) {
                  playSciFiSound('wake');
                  fetchEmotionJournal();
                }
              }}
              style={emotionOpen ? styles.emotionActiveBtn : styles.hudInactiveBtn}
              title="Toggle User Feelings Journal & Empathy Resonance"
            >
              {emotionOpen ? '❤️ Feelings: ON' : '❤️ Feelings: OFF'}
            </button>

            <button
              onClick={() => setAutoNarrate(!autoNarrate)}
              style={autoNarrate ? styles.narrateActiveBtn : styles.narrateInactiveBtn}
              title="Automatically read aloud new assistant messages"
            >
              {autoNarrate ? '🔊 Auto-Voice: ON' : '🔈 Auto-Voice: OFF'}
            </button>

            <button
              onClick={() => {
                const next = !wakeWordActive;
                setWakeWordActive(next);
                if (next) playSciFiSound('wake');
              }}
              style={wakeWordActive ? styles.wakeActiveBtn : styles.wakeInactiveBtn}
              title="Ambient hotword detection: Say 'Nexium...' or 'Hey Nexium...'"
            >
              {wakeWordActive ? '🎙️ Wake Word: ON' : '🎙️ Wake Word: OFF'}
            </button>

            <button
              onClick={() => {
                const next = !visionEnabled;
                setVisionEnabled(next);
                if (next) playSciFiSound('gesture');
              }}
              style={visionEnabled ? styles.visionActiveBtn : styles.visionInactiveBtn}
              title="Webcam Hand Gesture Vision Control"
            >
              {visionEnabled ? '🖐️ Vision HUD: ON' : '🖐️ Vision HUD: OFF'}
            </button>

            <button
              onClick={() => {
                setMessages([]);
                setSessionId(null);
              }}
              style={styles.clearButton}
            >
              Clear
            </button>
          </div>
        )}
      </header>

      {/* =================================================================== */}
      {/* TAB 1: REASONING CHAT VIEW                                          */}
      {/* =================================================================== */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {wakeWordActive && (
            <div style={styles.wakeStatusBar}>
              <span style={styles.pulseDot}></span>
              <span style={{ fontWeight: '700', color: '#10b981' }}>{wakeStatus}</span>
              <span style={{ color: '#8b949e', fontSize: '11px' }}>
                — Speak aloud: <em>"Nexium, how are you doing?"</em> or <em>"Nexium, check my specs"</em>
              </span>
            </div>
          )}
          <div style={styles.chatBox}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.messageWrapper,
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(m.role === 'user' ? styles.userBubble : styles.assistantBubble)
                  }}
                >
                  <div style={styles.roleHeaderRow}>
                    <div style={styles.roleHeader}>
                      {m.role === 'user' ? 'You' : 'NEXIUM Assistant'}
                    </div>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => speakText(m.content, idx)}
                        style={{
                          ...styles.voiceBtn,
                          ...(speakingIdx === idx ? styles.voiceBtnActive : {})
                        }}
                        title="Text-to-Speech narration"
                      >
                        {speakingIdx === idx ? '⏹️ Stop' : '🔊 Listen'}
                      </button>
                    )}
                  </div>

                  {/* Thinking Process Accordion */}
                  {m.thinking && (
                    <details style={styles.thinkingContainer}>
                      <summary style={styles.thinkingSummary}>
                        🧠 View Internal Thought Process ({m.thinking.length} chars)
                      </summary>
                      <div style={styles.thinkingContent}>
                        <pre style={styles.codeBlock}>{m.thinking}</pre>
                      </div>
                    </details>
                  )}

                  {/* Emotion Resonance Pill */}
                  {m.emotion && m.emotion.feeling && (
                    <div style={styles.emotionResonancePill}>
                      <span style={{ fontSize: '12px' }}>❤️</span>
                      <span style={{ fontWeight: '700', color: '#f43f5e' }}>Resonating State:</span>
                      <span style={{ color: '#fda4af' }}>{m.emotion.feeling.primary}</span>
                      <span style={styles.resonanceDot}>•</span>
                      <span>Valence: {m.emotion.feeling.valence > 0 ? `+${m.emotion.feeling.valence}` : m.emotion.feeling.valence}</span>
                      <span style={styles.resonanceDot}>•</span>
                      <span style={{ color: '#10b981', fontWeight: '600' }}>Empathy Attuned</span>
                    </div>
                  )}

                  {/* Micro-Thinking Sub-millisecond Timeline */}
                  {m.micro_thinking && m.micro_thinking.micro_steps && m.micro_thinking.micro_steps.length > 0 && (
                    <details style={styles.microThinkingDetails}>
                      <summary style={styles.microThinkingSummary}>
                        ⚡ Sub-millisecond Micro-Thinking ({m.micro_thinking.total_micro_steps} assertions • {m.micro_thinking.micro_latency_us || 180}μs • Status: {m.micro_thinking.status || 'Crystallized'})
                      </summary>
                      <div style={styles.microStepsList}>
                        {m.micro_thinking.micro_steps.map((uStep, uIdx) => (
                          <div key={uIdx} style={styles.microStepRow}>
                            <span style={styles.microStepId}>{uStep.id}</span>
                            <span style={styles.microStepType}>{uStep.type}</span>
                            <span style={styles.microStepStatus}>{uStep.status}</span>
                            <span style={styles.microStepDetail}>{uStep.detail || uStep.content}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Synaptic AI Neurons Firing Badge */}
                  {m.neural_telemetry && (
                    <div style={styles.neuralFiringBadge}>
                      <span>🧠 AI Neurons: {m.neural_telemetry.total_neurons?.toLocaleString() || '4,096'} mesh</span>
                      <span style={styles.resonanceDot}>•</span>
                      <span>Active Spikes: {m.neural_telemetry.active_firing_neurons?.toLocaleString() || m.neural_telemetry.total_spikes || '580'}</span>
                      <span style={styles.resonanceDot}>•</span>
                      <span>Firing Rate: {m.neural_telemetry.firing_rate_pct || 14.2}%</span>
                      <span style={styles.resonanceDot}>•</span>
                      <span style={{ color: '#38bdf8' }}>SwiGLU / GeLU Non-Linearity</span>
                    </div>
                  )}

                  {/* Tools Used Pills */}
                  {m.tools && m.tools.length > 0 && (
                    <div style={styles.toolsList}>
                      <span style={styles.toolsLabel}>Tools Executed:</span>
                      {m.tools.map((t, tIdx) => (
                        <span key={tIdx} style={styles.toolBadge}>
                          ⚡ {t.tool || t.name || JSON.stringify(t)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={styles.messageText}>{m.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.messageWrapper, justifyContent: 'flex-start' }}>
                <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                  <div style={styles.roleHeader}>NEXIUM Assistant</div>
                  <div style={styles.loadingSpinner}>
                    <span>🧠 Analyzing query & synthesizing solution...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Autonomous Device Tasks Quick Bar */}
          <div style={styles.deviceTasksBar}>
            <span style={styles.deviceTasksLabel}>⚡ Device Tasks:</span>
            <button
              type="button"
              style={styles.deviceActionChip}
              onClick={(e) => handleSend(e, "Run device task to inspect system specs, CPU, and RAM")}
            >
              💻 Hardware Specs
            </button>
            <button
              type="button"
              style={styles.deviceActionChip}
              onClick={(e) => handleSend(e, "Check battery status and power on this device")}
            >
              🔋 Battery Status
            </button>
            <button
              type="button"
              style={styles.deviceActionChip}
              onClick={(e) => handleSend(e, "Run device ping diagnostic on 8.8.8.8")}
            >
              🌐 Network Ping
            </button>
            <button
              type="button"
              style={styles.deviceActionChip}
              onClick={(e) => handleSend(e, "List files in my device workspace")}
            >
              📁 Workspace Files
            </button>
          </div>

          <form onSubmit={handleSend} style={styles.inputArea}>
            <button
              type="button"
              onClick={toggleListening}
              style={{
                ...styles.micBtn,
                ...(isListening ? styles.micBtnActive : {})
              }}
              title="Voice Dictation (Microphone)"
            >
              {isListening ? '🔴 Dictating...' : '🎙️ Mic'}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? "Listening to voice input..."
                  : mode === 'smart'
                    ? "Ask a coding challenge, system task, or website prompt..."
                    : "Type a prompt or speak into mic..."
              }
              style={styles.textInput}
            />
            <button type="submit" disabled={loading} style={styles.sendButton}>
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: AUTONOMOUS WEB STUDIO VIEW                                   */}
      {/* =================================================================== */}
      {activeTab === 'web_studio' && (
        <div style={styles.studioLayout}>
          {/* Left Controls & Configuration Panel */}
          <div style={styles.studioSidebar}>
            <div style={styles.studioSectionTitle}>🎨 Website Blueprint</div>

            <div style={styles.fieldGroup}>
              <label style={styles.studioLabel}>Website Title / Brand</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                style={styles.studioInput}
                placeholder="e.g. Apex Cloud"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.studioLabel}>Archetype / Template</label>
              <select
                value={siteTemplate}
                onChange={(e) => setSiteTemplate(e.target.value)}
                style={styles.studioSelect}
              >
                <option value="saas_landing">🚀 SaaS Product Landing Page</option>
                <option value="analytics_dashboard">📊 Interactive Analytics Dashboard</option>
                <option value="developer_portfolio">👨‍💻 Modern Developer Portfolio</option>
                <option value="web_os_desktop">🖥️ NEXIUM WebOS Desktop (Virtual Windows)</option>
                <option value="interactive_cyber_canvas">🌌 Cybernetic Particle Physics Canvas</option>
                <option value="node_workflow_builder">⚡ Autonomous AI Workflow Node Graph</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.studioLabel}>Color Palette & Theme</label>
              <select
                value={siteTheme}
                onChange={(e) => setSiteTheme(e.target.value)}
                style={styles.studioSelect}
              >
                <option value="cyber_violet">🟣 Cyber Violet (Neon Dark)</option>
                <option value="emerald_tech">🟢 Emerald Tech (Clean Mint)</option>
                <option value="ocean_blue">🔵 Ocean Blue (Midnight)</option>
                <option value="obsidian_dark">🟠 Obsidian Gold (Luxe Dark)</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.studioLabel}>Tagline / Custom Pitch</label>
              <textarea
                value={siteTagline}
                onChange={(e) => setSiteTagline(e.target.value)}
                style={{ ...styles.studioInput, height: '70px', resize: 'none' }}
                placeholder="Describe what your product does..."
              />
            </div>

            <button
              onClick={() => handleGenerateWebsite()}
              disabled={generatingWeb}
              style={styles.generateWebBtn}
            >
              {generatingWeb ? '⚡ Synthesizing Website...' : '⚡ Generate Full Website'}
            </button>

            {/* Quick Inspiration Presets */}
            <div style={{ marginTop: '20px' }}>
              <div style={styles.presetLabel}>✨ Quick Master Presets:</div>
              <div style={styles.presetGrid}>
                <button
                  style={styles.presetBtn}
                  onClick={() =>
                    handleGenerateWebsite({
                      title: 'HyperScale AI',
                      template: 'saas_landing',
                      theme: 'cyber_violet',
                      tagline: 'Autonomous AI agents accelerated by native Rust and microsecond guardrails.'
                    })
                  }
                >
                  🚀 AI Platform
                </button>
                <button
                  style={styles.presetBtn}
                  onClick={() =>
                    handleGenerateWebsite({
                      title: 'NEXIUM WebOS',
                      template: 'web_os_desktop',
                      theme: 'cyber_violet',
                      tagline: 'Virtual browser desktop operating system with live terminal and monitor.'
                    })
                  }
                >
                  🖥️ Virtual WebOS
                </button>
                <button
                  style={styles.presetBtn}
                  onClick={() =>
                    handleGenerateWebsite({
                      title: 'Cyber Constellation',
                      template: 'interactive_cyber_canvas',
                      theme: 'ocean_blue',
                      tagline: 'Dynamic particle constellation with interactive mouse gravity and vector physics.'
                    })
                  }
                >
                  🌌 Particle Physics
                </button>
                <button
                  style={styles.presetBtn}
                  onClick={() =>
                    handleGenerateWebsite({
                      title: 'Flow Orchestrator',
                      template: 'node_workflow_builder',
                      theme: 'emerald_tech',
                      tagline: 'Autonomous AI node workflow with live animated data packet flow.'
                    })
                  }
                >
                  ⚡ Workflow Graph
                </button>
                <button
                  style={styles.presetBtn}
                  onClick={() =>
                    handleGenerateWebsite({
                      title: 'Vortex Metrics',
                      template: 'analytics_dashboard',
                      theme: 'emerald_tech',
                      tagline: 'Zero-overhead distributed microservice observability.'
                    })
                  }
                >
                  📊 SaaS Dashboard
                </button>
                <button
                  style={styles.presetBtn}
                  onClick={() =>
                    handleGenerateWebsite({
                      title: 'Alex Vance',
                      template: 'developer_portfolio',
                      theme: 'obsidian_dark',
                      tagline: 'Principal Distributed Systems Engineer & Rust Core Contributor.'
                    })
                  }
                >
                  👨‍💻 Senior Architect
                </button>
              </div>
            </div>

            {generatedSite && (
              <div style={styles.metaBox}>
                <div><strong>Site ID:</strong> {generatedSite.id}</div>
                <div><strong>Source Size:</strong> {Math.round(generatedSite.code_length / 1024 * 10) / 10} KB</div>
                <div style={{ color: '#10b981', marginTop: '4px' }}>● 100% Self-Contained Offline HTML</div>
              </div>
            )}
          </div>

          {/* Right Live Viewport Simulator */}
          <div style={styles.studioPreviewContainer}>
            <div style={styles.viewportHeader}>
              <div style={styles.viewportControls}>
                <button
                  style={viewport === 'desktop' ? styles.viewBtnActive : styles.viewBtn}
                  onClick={() => setViewport('desktop')}
                >
                  🖥️ Desktop
                </button>
                <button
                  style={viewport === 'tablet' ? styles.viewBtnActive : styles.viewBtn}
                  onClick={() => setViewport('tablet')}
                >
                  📱 Tablet (768px)
                </button>
                <button
                  style={viewport === 'mobile' ? styles.viewBtnActive : styles.viewBtn}
                  onClick={() => setViewport('mobile')}
                >
                  📱 Mobile (375px)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.actionBtn} onClick={handleDownloadHtml}>
                  ↗️ Open in Tab
                </button>
              </div>
            </div>

            {/* Viewport Frame */}
            <div style={styles.viewportBody}>
              {generatedSite ? (
                <iframe
                  title="NEXIUM Live Web Preview"
                  src={`${API_BASE}${generatedSite.preview_url}`}
                  style={{
                    ...styles.previewFrame,
                    width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
                    borderRadius: viewport === 'desktop' ? '0px' : '12px',
                    border: viewport === 'desktop' ? 'none' : '1px solid #30363d'
                  }}
                />
              ) : (
                <div style={styles.emptyPreview}>
                  Generating site blueprint...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING SCI-FI HAND GESTURE VISION HUD                             */}
      {/* =================================================================== */}
      {visionEnabled && (
        <div style={styles.visionHudOverlay}>
          <div style={styles.visionHudHeader}>
            <div style={styles.visionHudTitle}>
              <span style={styles.visionOnlineDot}>●</span> GESTURE VISION CORE
            </div>
            <button
              onClick={() => setVisionEnabled(false)}
              style={styles.visionHudClose}
              title="Close Vision HUD"
            >
              ✕
            </button>
          </div>

          <div style={styles.visionFeedContainer}>
            <video
              ref={videoRef}
              muted
              playsInline
              style={styles.visionVideo}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Cyber Scanning Grid & Corners */}
            <div style={styles.visionScanline}></div>
            <div style={styles.hudCornerTL}></div>
            <div style={styles.hudCornerTR}></div>
            <div style={styles.hudCornerBL}></div>
            <div style={styles.hudCornerBR}></div>

            {/* Telemetry Badge */}
            <div style={styles.visionTelemetry}>
              <div style={styles.visionBadge}>
                {lastGesture ? lastGesture : '🖐️ TRACKING MOTION...'}
              </div>
              <div style={styles.visionStatusText}>
                {gestureFeedback}
              </div>
            </div>
          </div>

          <div style={styles.visionLegend}>
            <span>👋 Wave: <strong>Wake Up</strong></span>
            <span>👉 Left: <strong>Web Studio</strong></span>
            <span>👈 Right: <strong>Chat</strong></span>
            <span>✋ Palm: <strong>Mute Audio</strong></span>
            <span>👆 Up: <strong>Specs</strong></span>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING RUST SUPERCOMPUTER HUD                                     */}
      {/* =================================================================== */}
      {supercomputerOpen && (
        <div style={styles.supercomputerHudOverlay}>
          <div style={styles.hudCardHeader}>
            <div style={styles.hudCardTitle}>
              <span style={{ color: '#f59e0b', marginRight: '6px' }}>⚡</span>
              <span>RUST SUPERCOMPUTER CLUSTER HUD</span>
            </div>
            <button
              onClick={() => setSupercomputerOpen(false)}
              style={styles.visionHudClose}
            >
              ✕
            </button>
          </div>

          <div style={styles.hudBodyContent}>
            <div style={styles.hudMetaGrid}>
              <div style={styles.hudMetricBox}>
                <div style={styles.hudMetricLabel}>CLUSTER NODE</div>
                <div style={styles.hudMetricVal}>TITAN-HEAVY-RUST</div>
              </div>
              <div style={styles.hudMetricBox}>
                <div style={styles.hudMetricLabel}>CPU WORKERS</div>
                <div style={styles.hudMetricVal}>{supercomputerData?.worker_threads || 16} Cores</div>
              </div>
              <div style={styles.hudMetricBox}>
                <div style={styles.hudMetricLabel}>PEAK THEORETICAL</div>
                <div style={styles.hudMetricVal}>{supercomputerData?.peak_theoretical_gflops || '256.0'} GFLOPS</div>
              </div>
              <div style={styles.hudMetricBox}>
                <div style={styles.hudMetricLabel}>RAM DETECTED</div>
                <div style={styles.hudMetricVal}>{supercomputerData?.system_memory_total_gb || '31.8'} GB</div>
              </div>
            </div>

            {/* Live GEMM Benchmark Runner */}
            <div style={styles.hudBenchSection}>
              <div style={styles.benchHeaderRow}>
                <span style={{ fontWeight: '700', fontSize: '12px', color: '#f59e0b' }}>
                  ⚡ CACHE-BLOCKED TENSOR GEMM BENCHMARK
                </span>
                <button
                  onClick={handleRunSupercomputerBenchmark}
                  disabled={benchmarking}
                  style={benchmarking ? styles.benchBtnDisabled : styles.benchBtn}
                >
                  {benchmarking ? '⚙️ Computing...' : '▶ Run GEMM Benchmark'}
                </button>
              </div>

              {supercomputerData?.benchmark && (
                <div style={styles.benchResultsGrid}>
                  <div style={styles.benchStat}>
                    <span style={styles.benchStatLabel}>Throughput:</span>
                    <span style={styles.benchStatValGreen}>{supercomputerData.benchmark.gflops} GFLOPS</span>
                  </div>
                  <div style={styles.benchStat}>
                    <span style={styles.benchStatLabel}>Memory Bandwidth:</span>
                    <span style={styles.benchStatVal}>{supercomputerData.benchmark.memory_bandwidth_gbps} GB/s</span>
                  </div>
                  <div style={styles.benchStat}>
                    <span style={styles.benchStatLabel}>Tensor FLOPs:</span>
                    <span style={styles.benchStatVal}>{supercomputerData.benchmark.total_flops?.toLocaleString()}</span>
                  </div>
                  <div style={styles.benchStat}>
                    <span style={styles.benchStatLabel}>Pipeline:</span>
                    <span style={{ ...styles.benchStatVal, color: '#38bdf8' }}>{supercomputerData.benchmark.simd_pipeline}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING 4,096 SYNAPTIC AI NEURONS VISUALIZER HUD                   */}
      {/* =================================================================== */}
      {neuralOpen && (
        <div style={styles.neuralHudOverlay}>
          <div style={styles.hudCardHeader}>
            <div style={styles.hudCardTitle}>
              <span style={{ color: '#38bdf8', marginRight: '6px' }}>🧠</span>
              <span>4,096 SYNAPTIC AI NEURONS HUD</span>
            </div>
            <button
              onClick={() => setNeuralOpen(false)}
              style={styles.visionHudClose}
            >
              ✕
            </button>
          </div>

          <div style={styles.hudBodyContent}>
            <div style={styles.hudMetaGrid}>
              <div style={styles.hudMetricBox}>
                <div style={styles.hudMetricLabel}>TOTAL NEURONS</div>
                <div style={styles.hudMetricVal}>4,096</div>
              </div>
              <div style={styles.hudMetricBox}>
                <div style={styles.hudMetricLabel}>ACTIVE SPIKES</div>
                <div style={styles.hudMetricVal}>{neuralData?.latest_telemetry?.active_firing_neurons || 582}</div>
              </div>
              <div style={styles.hudMetricBox}>
                <div style={styles.hudMetricLabel}>GLOBAL FIRING RATE</div>
                <div style={styles.hudMetricVal}>{neuralData?.latest_telemetry?.firing_rate_pct || 14.2}%</div>
              </div>
              <div style={styles.hudMetricBox}>
                <div style={styles.hudMetricLabel}>ACTIVATION KERNEL</div>
                <div style={styles.hudMetricVal}>SwiGLU / GeLU</div>
              </div>
            </div>

            {/* Neural Layers Visualizer */}
            <div style={styles.neuralLayersContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
                  SYNAPTIC LAYER FIRING METRICS (1,024 NEURONS / LAYER)
                </span>
                <button
                  onClick={handleFireSynapses}
                  disabled={firingSynapses}
                  style={firingSynapses ? styles.neuralFireBtnDisabled : styles.neuralFireBtn}
                >
                  {firingSynapses ? '⚡ Firing...' : '⚡ Pulse Synapses'}
                </button>
              </div>

              {(neuralData?.latest_telemetry?.layers || []).map((layer, lIdx) => (
                <div key={lIdx} style={styles.neuralLayerRow}>
                  <div style={styles.neuralLayerInfo}>
                    <span style={{ color: '#38bdf8', fontWeight: '600' }}>{layer.layer_name || `L${lIdx+1}-SwiGLU`}</span>
                    <span style={{ color: '#8b949e', fontSize: '11px' }}>
                      {layer.active_neurons || 0} active ({layer.layer_firing_rate || 0}%)
                    </span>
                  </div>
                  <div style={styles.neuralMeterTrack}>
                    <div
                      style={{
                        ...styles.neuralMeterFill,
                        width: `${Math.min(100, layer.layer_firing_rate || 20)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING USER FEELINGS JOURNAL & EMPATHY HUD                         */}
      {/* =================================================================== */}
      {emotionOpen && (
        <div style={styles.emotionHudOverlay}>
          <div style={styles.hudCardHeader}>
            <div style={styles.hudCardTitle}>
              <span style={{ color: '#f43f5e', marginRight: '6px' }}>❤️</span>
              <span>USER FEELINGS & RAPPORT JOURNAL</span>
            </div>
            <button
              onClick={() => setEmotionOpen(false)}
              style={styles.visionHudClose}
            >
              ✕
            </button>
          </div>

          <div style={styles.hudBodyContent}>
            {/* Active Feeling Gauges */}
            <div style={styles.emotionActiveCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#fda4af', fontWeight: '700' }}>ACTIVE EMOTIONAL CLIMATE</span>
                <span style={styles.empathyTag}>Empathy: 98% Attuned</span>
              </div>
              <div style={styles.emotionPrimaryTitle}>{activeEmotion?.primary || 'Thoughtful Focus'}</div>

              <div style={styles.emotionGaugesRow}>
                <div style={{ flex: 1 }}>
                  <div style={styles.emotionGaugeLabel}>
                    <span>Valence</span>
                    <span style={{ color: activeEmotion?.valence >= 0 ? '#10b981' : '#ef4444' }}>
                      {activeEmotion?.valence >= 0 ? `+${activeEmotion.valence}` : activeEmotion.valence}
                    </span>
                  </div>
                  <div style={styles.gaugeTrack}>
                    <div
                      style={{
                        ...styles.gaugeFill,
                        width: `${Math.max(10, Math.min(100, ((activeEmotion?.valence || 0) + 1) * 50))}%`,
                        backgroundColor: activeEmotion?.valence >= 0 ? '#10b981' : '#ef4444'
                      }}
                    />
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={styles.emotionGaugeLabel}>
                    <span>Arousal</span>
                    <span style={{ color: '#38bdf8' }}>{activeEmotion?.arousal || 0.70}</span>
                  </div>
                  <div style={styles.gaugeTrack}>
                    <div
                      style={{
                        ...styles.gaugeFill,
                        width: `${Math.max(10, Math.min(100, (activeEmotion?.arousal || 0.5) * 100))}%`,
                        backgroundColor: '#38bdf8'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Persistent Feelings Journal List */}
            <div style={styles.journalHeaderRow}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
                PERSISTENT FEELINGS JOURNAL (ON DISK)
              </span>
              <button
                onClick={fetchEmotionJournal}
                style={styles.refreshJournalBtn}
                title="Refresh feelings journal"
              >
                ↻ Refresh
              </button>
            </div>

            <div style={styles.journalListScroll}>
              {emotionJournal.length === 0 ? (
                <div style={{ color: '#8b949e', fontSize: '11px', padding: '10px' }}>
                  No feelings entries logged yet. Chat with NEXIUM to begin journaling.
                </div>
              ) : (
                emotionJournal.map((entry, eIdx) => (
                  <div key={eIdx} style={styles.journalEntryCard}>
                    <div style={styles.journalEntryHeader}>
                      <span style={{ color: '#fda4af', fontWeight: '700' }}>{entry.primary}</span>
                      <span style={{ color: '#6e7681', fontSize: '10px' }}>{entry.formatted_time || 'Recent'}</span>
                    </div>
                    <div style={styles.journalExcerpt}>"{entry.user_excerpt || 'User interaction'}"</div>
                    <div style={styles.journalFooter}>
                      <span>Valence: {entry.valence > 0 ? `+${entry.valence}` : entry.valence}</span>
                      <span>Intensity: {entry.intensity}</span>
                      <span style={{ color: '#10b981' }}>Empathy: 98%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#58a6ff'
  },
  logoBadge: {
    backgroundColor: '#238636',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px',
    letterSpacing: '0.5px'
  },
  tabGroup: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#0d1117',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #30363d'
  },
  tabActive: {
    backgroundColor: '#238636',
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tabInactive: {
    backgroundColor: 'transparent',
    color: '#8b949e',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  label: {
    fontSize: '13px',
    color: '#8b949e'
  },
  select: {
    backgroundColor: '#21262d',
    color: '#c9d1d9',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none'
  },
  clearButton: {
    backgroundColor: '#21262d',
    color: '#8b949e',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  narrateActiveBtn: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)'
  },
  narrateInactiveBtn: {
    backgroundColor: '#21262d',
    color: '#8b949e',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  messageWrapper: {
    display: 'flex',
    width: '100%'
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '14px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  userBubble: {
    backgroundColor: '#1f6feb',
    color: '#ffffff',
    borderBottomRightRadius: '2px'
  },
  assistantBubble: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    color: '#c9d1d9',
    borderBottomLeftRadius: '2px'
  },
  roleHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  roleHeader: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#8b949e',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  voiceBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid #30363d',
    color: '#8b949e',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  voiceBtnActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    color: '#ffffff',
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
  },
  deviceTasksBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 24px',
    backgroundColor: '#0d1117',
    borderTop: '1px solid #21262d',
    overflowX: 'auto'
  },
  deviceTasksLabel: {
    fontSize: '11px',
    color: '#8b949e',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  deviceActionChip: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    color: '#c9d1d9',
    borderRadius: '16px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  micBtn: {
    backgroundColor: '#21262d',
    border: '1px solid #30363d',
    color: '#c9d1d9',
    borderRadius: '6px',
    padding: '0 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  micBtnActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)'
  },
  thinkingContainer: {
    marginBottom: '12px',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '8px 12px'
  },
  thinkingSummary: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#e3b341',
    cursor: 'pointer',
    outline: 'none'
  },
  thinkingContent: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#8b949e',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  toolsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
    marginBottom: '10px'
  },
  toolsLabel: {
    fontSize: '11px',
    color: '#8b949e'
  },
  toolBadge: {
    backgroundColor: '#238636',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  messageText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  codeBlock: {
    margin: 0,
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '12px',
    whiteSpace: 'pre-wrap'
  },
  loadingSpinner: {
    fontSize: '13px',
    color: '#58a6ff',
    fontStyle: 'italic'
  },
  inputArea: {
    display: 'flex',
    padding: '16px 24px',
    backgroundColor: '#161b22',
    borderTop: '1px solid #30363d',
    gap: '12px'
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '12px 16px',
    color: '#c9d1d9',
    fontSize: '14px',
    outline: 'none'
  },
  sendButton: {
    backgroundColor: '#238636',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '0 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // ==========================================
  // Web Studio Styles
  // ==========================================
  studioLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  studioSidebar: {
    width: '320px',
    backgroundColor: '#161b22',
    borderRight: '1px solid #30363d',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto'
  },
  studioSectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#58a6ff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  studioLabel: {
    fontSize: '12px',
    color: '#8b949e',
    fontWeight: '600'
  },
  studioInput: {
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#c9d1d9',
    fontSize: '13px',
    outline: 'none'
  },
  studioSelect: {
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#c9d1d9',
    fontSize: '13px',
    outline: 'none'
  },
  generateWebBtn: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
  },
  presetLabel: {
    fontSize: '12px',
    color: '#8b949e',
    fontWeight: '600',
    marginBottom: '8px'
  },
  presetGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  presetBtn: {
    backgroundColor: '#21262d',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '6px 10px',
    color: '#c9d1d9',
    fontSize: '12px',
    textAlign: 'left',
    cursor: 'pointer'
  },
  metaBox: {
    marginTop: 'auto',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '11px',
    color: '#8b949e'
  },
  studioPreviewContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0b0f19'
  },
  viewportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d'
  },
  viewportControls: {
    display: 'flex',
    gap: '6px'
  },
  viewBtn: {
    backgroundColor: '#21262d',
    border: '1px solid #30363d',
    color: '#8b949e',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  viewBtnActive: {
    backgroundColor: '#30363d',
    border: '1px solid #58a6ff',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  actionBtn: {
    backgroundColor: '#238636',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  viewportBody: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: '16px'
  },
  previewFrame: {
    height: '100%',
    backgroundColor: '#ffffff',
    border: 'none',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  emptyPreview: {
    color: '#8b949e',
    fontSize: '14px'
  },

  // ==========================================
  // Wake Word & Gesture Vision HUD Styles
  // ==========================================
  wakeActiveBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
  },
  wakeInactiveBtn: {
    backgroundColor: '#21262d',
    color: '#8b949e',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  visionActiveBtn: {
    backgroundColor: '#0ea5e9',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)'
  },
  visionInactiveBtn: {
    backgroundColor: '#21262d',
    color: '#8b949e',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  wakeStatusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 24px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
    fontSize: '12px'
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 8px #10b981',
    display: 'inline-block'
  },
  visionHudOverlay: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '260px',
    backgroundColor: 'rgba(11, 15, 25, 0.94)',
    backdropFilter: 'blur(16px)',
    border: '1px solid #0ea5e9',
    borderRadius: '12px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(14, 165, 233, 0.25)',
    zIndex: 9999,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  visionHudHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderBottom: '1px solid rgba(14, 165, 233, 0.3)'
  },
  visionHudTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  visionOnlineDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 6px #10b981',
    display: 'inline-block'
  },
  visionHudClose: {
    background: 'transparent',
    border: 'none',
    color: '#8b949e',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700'
  },
  visionFeedContainer: {
    position: 'relative',
    width: '100%',
    height: '140px',
    backgroundColor: '#000',
    overflow: 'hidden'
  },
  visionVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
    opacity: 0.85
  },
  visionScanline: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'linear-gradient(rgba(14, 165, 233, 0) 50%, rgba(14, 165, 233, 0.15) 50%)',
    backgroundSize: '100% 4px'
  },
  hudCornerTL: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    width: '12px',
    height: '12px',
    borderTop: '2px solid #38bdf8',
    borderLeft: '2px solid #38bdf8',
    pointerEvents: 'none'
  },
  hudCornerTR: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '12px',
    height: '12px',
    borderTop: '2px solid #38bdf8',
    borderRight: '2px solid #38bdf8',
    pointerEvents: 'none'
  },
  hudCornerBL: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    width: '12px',
    height: '12px',
    borderBottom: '2px solid #38bdf8',
    borderLeft: '2px solid #38bdf8',
    pointerEvents: 'none'
  },
  hudCornerBR: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    width: '12px',
    height: '12px',
    borderBottom: '2px solid #38bdf8',
    borderRight: '2px solid #38bdf8',
    pointerEvents: 'none'
  },
  visionTelemetry: {
    position: 'absolute',
    bottom: '6px',
    left: '8px',
    right: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  visionBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid #38bdf8',
    color: '#38bdf8',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: '700'
  },
  visionStatusText: {
    fontSize: '10px',
    color: '#10b981',
    fontWeight: '600'
  },
  visionLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 8px',
    padding: '8px 10px',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    fontSize: '10px',
    color: '#94a3b8'
  },
  hudActiveBtn: {
    backgroundColor: '#f59e0b',
    color: '#000',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  hudInactiveBtn: {
    backgroundColor: '#21262d',
    color: '#c9d1d9',
    border: '1px solid #30363d',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  neuralActiveBtn: {
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  emotionActiveBtn: {
    backgroundColor: '#e11d48',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  emotionResonancePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    borderRadius: '6px',
    padding: '4px 8px',
    margin: '6px 0',
    fontSize: '11px',
    color: '#e2e8f0',
  },
  resonanceDot: {
    color: '#64748b',
    fontSize: '10px',
  },
  microThinkingDetails: {
    margin: '6px 0',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
    padding: '4px 8px',
  },
  microThinkingSummary: {
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700',
    color: '#f59e0b',
    outline: 'none',
  },
  microStepsList: {
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  microStepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    padding: '2px 4px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '4px',
  },
  microStepId: {
    color: '#f59e0b',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  microStepType: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  microStepStatus: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '9px',
    fontWeight: '700',
  },
  microStepDetail: {
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  neuralFiringBadge: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '6px',
    padding: '4px 8px',
    margin: '6px 0',
    fontSize: '11px',
    color: '#e2e8f0',
  },
  supercomputerHudOverlay: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    width: '420px',
    backgroundColor: '#0f172a',
    border: '1px solid #f59e0b',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.2)',
    zIndex: 9999,
    overflow: 'hidden',
  },
  neuralHudOverlay: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '440px',
    backgroundColor: '#0f172a',
    border: '1px solid #0284c7',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(2, 132, 199, 0.2)',
    zIndex: 9999,
    overflow: 'hidden',
  },
  emotionHudOverlay: {
    position: 'fixed',
    top: '70px',
    right: '24px',
    width: '420px',
    maxHeight: '680px',
    backgroundColor: '#0f172a',
    border: '1px solid #e11d48',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(225, 29, 72, 0.2)',
    zIndex: 9999,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  hudCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  hudCardTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    color: '#f8fafc',
  },
  hudBodyContent: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  hudMetaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  hudMetricBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '6px',
    padding: '8px',
  },
  hudMetricLabel: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.5px',
  },
  hudMetricVal: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: '2px',
  },
  hudBenchSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    borderRadius: '8px',
    padding: '10px',
  },
  benchHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  benchBtn: {
    backgroundColor: '#f59e0b',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  benchBtnDisabled: {
    backgroundColor: '#78350f',
    color: '#d97706',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'not-allowed',
  },
  benchResultsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  benchStat: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '10px',
  },
  benchStatLabel: {
    color: '#94a3b8',
  },
  benchStatVal: {
    fontWeight: '700',
    color: '#f8fafc',
  },
  benchStatValGreen: {
    fontWeight: '800',
    color: '#10b981',
    fontSize: '12px',
  },
  neuralLayersContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '8px',
    padding: '10px',
  },
  neuralFireBtn: {
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  neuralFireBtnDisabled: {
    backgroundColor: '#075985',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'not-allowed',
  },
  neuralLayerRow: {
    marginTop: '6px',
  },
  neuralLayerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    marginBottom: '2px',
  },
  neuralMeterTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#1e293b',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  neuralMeterFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
    transition: 'width 0.3s ease',
  },
  emotionActiveCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(244, 63, 94, 0.25)',
    borderRadius: '8px',
    padding: '10px',
  },
  empathyTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '9px',
    fontWeight: '700',
  },
  emotionPrimaryTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#fda4af',
    margin: '6px 0 10px 0',
  },
  emotionGaugesRow: {
    display: 'flex',
    gap: '12px',
  },
  emotionGaugeLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#94a3b8',
    marginBottom: '3px',
    fontWeight: '600',
  },
  gaugeTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#1e293b',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  journalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshJournalBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #30363d',
    color: '#94a3b8',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '10px',
    cursor: 'pointer',
  },
  journalListScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  journalEntryCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '6px',
    padding: '8px',
    fontSize: '10px',
  },
  journalEntryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  journalExcerpt: {
    color: '#cbd5e1',
    fontStyle: 'italic',
    marginBottom: '4px',
  },
  journalFooter: {
    display: 'flex',
    gap: '8px',
    color: '#64748b',
    fontSize: '9px',
  }
};

export default App;
