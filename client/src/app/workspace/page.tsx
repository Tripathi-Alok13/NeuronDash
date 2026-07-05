"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { 
  MessageSquare, 
  Activity, 
  Database, 
  Plus, 
  HelpCircle, 
  User, 
  Search, 
  Bell, 
  Moon, 
  Upload, 
  TrendingDown, 
  CheckCircle, 
  Table, 
  X, 
  Paperclip, 
  Send, 
  AlertTriangle,
  LineChart,
  FileText,
  Menu
} from "lucide-react";

const getBackendUrl = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  const hostname = window.location.hostname;
  const isLocalIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);
  if (isLocalIp) {
    return `http://${hostname}:8000`;
  }
  return "http://localhost:8000";
};

const BACKEND_URL = getBackendUrl();

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: { step: string; status: string }[];
  widget?: any;
}

interface Anomaly {
  id: string;
  column_name?: string;
  anomaly_type: string;
  severity: string;
  description: string;
  suggested_fix?: any;
  is_resolved: boolean;
}

const formatKpiValue = (val: any, metricName: string) => {
  if (val === undefined || val === null) return "N/A";
  if (typeof val === "string") return val;
  
  const numVal = Number(val);
  if (isNaN(numVal)) return String(val);
  
  // Detect if the metric name or column name indicates a date, and the value looks like a timestamp (seconds or milliseconds)
  const isDate = /date|time/i.test(metricName || "");
  if (isDate && numVal > 1000000000) {
    try {
      // If it's in seconds, convert to milliseconds
      const ms = numVal < 10000000000 ? numVal * 1000 : numVal;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (e) {
      // fallback
    }
  }

  // If the number is huge (e.g. >= 10,000,000), let's use compact notation to avoid overflow, otherwise standard formatting
  if (Math.abs(numVal) >= 10000000) {
    return numVal.toLocaleString(undefined, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2
    });
  }

  return numVal.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const getKpiFontSize = (valStr: string) => {
  if (valStr.length > 16) return "text-base md:text-lg";
  if (valStr.length > 12) return "text-lg md:text-xl";
  if (valStr.length > 8) return "text-xl md:text-2xl";
  return "text-3xl md:text-4xl";
};

const formatMetricValueShort = (val: number) => {
  if (val === null || val === undefined || isNaN(val)) return "0";
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
};

export default function WorkspacePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<any | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard" | "visualize" | "report">("chat");
  const [activeTemplate, setActiveTemplate] = useState<string>("auto");
  const [activeDashboard, setActiveDashboard] = useState<any | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);
  // App states
  const [uploadStatus, setUploadStatus] = useState<string>("idle"); // idle, uploading, completed, failed
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  

  
  // Help Center states
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [activeHelpIdx, setActiveHelpIdx] = useState<number | null>(null);
  
  // Sorting & Filtering Table States
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [tableSearch, setTableSearch] = useState<string>("");
  const [reportSearch, setReportSearch] = useState<string>("");
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Right sidebar dataset state
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(true);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  
  // Interactive Visualizer Page States
  const [visualizeChartType, setVisualizeChartType] = useState<string>("bar");
  const [visualizeXCol, setVisualizeXCol] = useState<string>("");
  const [visualizeYCol, setVisualizeYCol] = useState<string>("");
  const [visualizeAggr, setVisualizeAggr] = useState<string>("sum");
  const [visualizeColor, setVisualizeColor] = useState<string>("emerald");
  const [visualizeData, setVisualizeData] = useState<any[]>([]);
  const [visualizeInsights, setVisualizeInsights] = useState<string>("");
  const [visualizeStory, setVisualizeStory] = useState<string>("");
  const [visualizeLoading, setVisualizeLoading] = useState<boolean>(false);
  const [activeNarratorTab, setActiveNarratorTab] = useState<"insights" | "story">("insights");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Reset visualizer data and insights when dataset changes to avoid stale configurations
  useEffect(() => {
    if (datasetId) {
      setVisualizeData([]);
      setVisualizeInsights("");
      setVisualizeStory("");
    }
  }, [datasetId]);

  // 1. Setup Session & Project on mount
  useEffect(() => {
    async function initSession() {
      try {
        const storedToken = localStorage.getItem("neurondash_token");
        if (!storedToken) {
          router.push("/login");
          return;
        }
        setToken(storedToken);
        

        
        // Fetch projects
        const projectsRes = await fetch(`${BACKEND_URL}/api/v1/projects/`, {
          headers: { "Authorization": `Bearer ${storedToken}` }
        });
        
        let activeProjectId = null;
        
        if (projectsRes.status === 401) {
          localStorage.removeItem("neurondash_token");
          router.push("/login");
          return;
        }
        
        if (projectsRes.ok) {
          const projects = await projectsRes.json();
          if (projects && projects.length > 0) {
            activeProjectId = projects[0].id;
          }
        }
        
        if (!activeProjectId) {
          // Create a new default sandbox project
          const projRes = await fetch(`${BACKEND_URL}/api/v1/projects/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${storedToken}`
            },
            body: JSON.stringify({
              name: "Initial Data Project",
              description: "Default sandbox workspace"
            })
          });
          
          if (projRes.ok) {
            const proj = await projRes.json();
            activeProjectId = proj.id;
          } else {
            throw new Error("Project creation failed");
          }
        }
        
        setProjectId(activeProjectId);
        
        // Init Chat conversation (creates a new session and cleans older logs on database)
        const convRes = await fetch(`${BACKEND_URL}/api/v1/chat/conversations?project_id=${activeProjectId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${storedToken}` }
        });
        
        if (convRes.ok) {
          const conv = await convRes.json();
          setConversationId(conv.id);
          
          // Fetch existing message history
          const msgHistoryRes = await fetch(`${BACKEND_URL}/api/v1/chat/conversations/${conv.id}/messages`, {
            headers: { "Authorization": `Bearer ${storedToken}` }
          });
          
          if (msgHistoryRes.ok) {
            const history = await msgHistoryRes.json();
            if (history && history.length > 0) {
              const formattedHistory = history.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                steps: m.status_details?.steps,
                widget: m.context_references?.recommended_widget
              }));
              setMessages(formattedHistory);
            } else {
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content: "Welcome to **NeuronDash AI Workspace**! Drag & drop an Excel, CSV, PDF, or Word file to begin cleaning and generating interactive insights."
                }
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
        router.push("/login");
      }
    }
    initSession();
  }, [router]);



  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Theme sync on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const handleHeaderClick = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedRows = React.useMemo(() => {
    let result = [...rows];
    
    // Search Filter
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter(row => 
        columns.some(col => String(row[col] ?? "").toLowerCase().includes(q))
      );
    }
    
    // Column Sorting
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        const numA = Number(valA);
        const numB = Number(valB);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === "asc" ? numA - numB : numB - numA;
        }
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (strA < strB) return sortDirection === "asc" ? -1 : 1;
        if (strA > strB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [rows, columns, tableSearch, sortColumn, sortDirection]);

  // 2. Upload file handler
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !projectId || !token) return;
    
    setUploadStatus("uploading");
    setUploadError(null);
    setProgressPercent(15);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      setProgressPercent(45);
      const res = await fetch(`${BACKEND_URL}/api/v1/files/upload?project_id=${projectId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "File processing error");
      }
      
      setProgressPercent(80);
      const fileData = await res.json();
      
      // Load dataset associated with the uploaded file
      const datasetRes = await fetch(`${BACKEND_URL}/api/v1/datasets/${fileData.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (datasetRes.ok) {
        const dataset = await datasetRes.json();
        setDatasetId(dataset.id);
        setUploadStatus("completed");
        setProgressPercent(100);
        setActiveTab("dashboard");
        
        // Fetch preview rows & anomalies
        fetchPreview(dataset.id);
        fetchAnomalies(dataset.id);
        
        // Trigger Default Dashboard Selection on Upload
        handleSelectTemplate("auto", dataset.id);
        
        // Cycle clean conversation session (delete old mess and start fresh welcome chat)
        try {
          const convRes = await fetch(`${BACKEND_URL}/api/v1/chat/conversations?project_id=${projectId}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (convRes.ok) {
            const conv = await convRes.json();
            setConversationId(conv.id);
            setMessages([
              {
                id: `msg_file_${Date.now()}`,
                role: "assistant",
                content: `I have successfully parsed **${selectedFile.name}**. I detected **${dataset.row_count} rows** and **${dataset.column_count} columns**.\n\nI flagged anomalies and outliers for your review in the sidebar preview.\n\nYou can ask me natural language queries about this dataset below!`,
                steps: [
                  { step: "Extracted dataset structure", status: "completed" },
                  { step: "Identified duplicate rows", status: "completed" },
                  { step: "Flagged column type anomalies", status: "completed" }
                ]
              }
            ]);
          }
        } catch (convErr) {
          console.error("New conversation reset failed:", convErr);
        }
      }
    } catch (err: any) {
      setUploadStatus("failed");
      setUploadError(err.message || "Failed to process file.");
    }
  };

  const fetchPreview = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/datasets/${id}/preview?limit=50`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setColumns(data.columns);
        setRows(data.rows);
        setTotalRows(data.total_rows);
      }
      
      const infoRes = await fetch(`${BACKEND_URL}/api/v1/datasets/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setDatasetInfo(infoData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnomalies = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/datasets/${id}/anomalies`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Automated Cleaning application
  const triggerAutoClean = async () => {
    if (!datasetId || !token || anomalies.length === 0) return;
    
    try {
      setIsProcessing(true);
      const approvedIds = anomalies.map(a => a.id);
      
      const res = await fetch(`${BACKEND_URL}/api/v1/datasets/${datasetId}/clean`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          approved_ops: approvedIds,
          reject_ops: []
        })
      });
      
      if (res.ok) {
        const updatedDataset = await res.json();
        setAnomalies([]);
        fetchPreview(updatedDataset.id);
        
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_clean_${Date.now()}`,
            role: "assistant",
            content: "Data cleaning process completed. All duplicate rows have been dropped, nulls filled, and numeric outliers clamped. The dataset is now clean."
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Send chat message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !projectId || !token) return;
    
    setInputText("");
    
    const userMsg: Message = { id: `user_${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    
    try {
      let activeConvId = conversationId;
      
      if (!activeConvId) {
        const convRes = await fetch(`${BACKEND_URL}/api/v1/chat/conversations?project_id=${projectId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (convRes.ok) {
          const conv = await convRes.json();
          activeConvId = conv.id;
          setConversationId(conv.id);
        }
      }
      
      if (activeConvId) {
        const msgRes = await fetch(`${BACKEND_URL}/api/v1/chat/conversations/${activeConvId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ content: text })
        });
        
        if (msgRes.ok) {
          const assistantReply = await msgRes.json();
          
          setMessages((prev) => [
            ...prev,
            {
              id: assistantReply.id,
              role: "assistant",
              content: assistantReply.content,
              steps: assistantReply.status_details?.steps,
              widget: assistantReply.context_references?.recommended_widget
            }
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render visual chart widgets based on type (supports 7 premium types: KPI, Bar, Line, Pie, Scatter, Heatmap, Area)
  const renderWidgetChart = (widget: any) => {
    const chartType = (widget.chart_type || "bar").toLowerCase();
    
    // Find numeric columns and categorical columns from the dataset
    const numCols = columns.filter(c => rows.some(r => typeof r[c] === "number" || (!isNaN(Number(r[c])) && r[c] !== null && r[c] !== "")));
    const catCols = columns.filter(c => !numCols.includes(c));
    let x = widget.data_query?.x || catCols[0] || columns[0];
    let y = widget.data_query?.y || widget.data_query?.metric || numCols[0] || columns[1] || columns[0];

    // 1. KPI Card
    if (chartType === "kpi") {
      const metric = widget.data_query?.metric || numCols[0] || columns[0];
      const vals = rows.map(r => Number(r[metric])).filter(v => !isNaN(v));
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const formattedVal = formatKpiValue(avg, metric);
      const fontSizeClass = getKpiFontSize(formattedVal);
      return (
        <div className="p-4 bg-surface-container-low rounded-xl flex flex-col justify-center items-center text-center max-w-full overflow-hidden">
          <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-2 truncate max-w-full">Calculated Metric ({metric})</span>
          <span className={`font-black text-primary tracking-tight ${fontSizeClass} truncate max-w-full break-all`}>{formattedVal}</span>
          <span className="text-[10px] text-tertiary font-bold mt-2 truncate max-w-full">Aggregated Average value across {rows.length} rows</span>
        </div>
      );
    }

    // Prepare chart data (up to 8 points)
    const chartData = rows.slice(0, 8).map((r, i) => {
      const xVal = String(r[x] || `Row ${i + 1}`).substring(0, 10);
      const yVal = Number(r[y]) || 0;
      return { x: xVal, y: yVal };
    });
    
    const widgetValues = chartData.map(d => Number(d.y) || 0);
    const maxVal = widgetValues.length > 0 ? Math.max(...widgetValues, 1) : 1;

    // 2. Bar Chart
    if (chartType === "bar") {
      const width = 300;
      const height = 120;
      const paddingLeft = 35;
      const paddingRight = 15;
      const paddingTop = 15;
      const paddingBottom = 15;
      const activeWidth = width - paddingLeft - paddingRight;
      const activeHeight = height - paddingTop - paddingBottom;

      const numTicks = 4;
      const ticks = Array.from({ length: numTicks + 1 }, (_, idx) => {
        const ratio = idx / numTicks;
        const val = maxVal * ratio;
        const yPos = paddingTop + activeHeight - ratio * activeHeight;
        return { label: formatMetricValueShort(val), y: yPos };
      });

      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between">
          <div className="flex-1 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
              {/* Horizontal Gridlines */}
              {ticks.map((t, idx) => (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={t.y} 
                    x2={width - paddingRight} 
                    y2={t.y} 
                    stroke="var(--color-outline-variant, #bccbb9)" 
                    strokeWidth="0.5" 
                    strokeOpacity="0.35" 
                    strokeDasharray="2 2" 
                  />
                  <text 
                    x={paddingLeft - 6} 
                    y={t.y} 
                    fontSize="6" 
                    fontWeight="bold" 
                    fill="var(--color-tertiary, #5c5f61)" 
                    textAnchor="end" 
                    alignmentBaseline="middle"
                  >
                    {t.label}
                  </text>
                </g>
              ))}

              {/* Bars and labels */}
              {chartData.map((d, i) => {
                const barSpacing = activeWidth / (chartData.length || 1);
                const barWidth = barSpacing * 0.6;
                const spacing = barSpacing * 0.4;
                const px = paddingLeft + i * barSpacing + spacing / 2;
                const h = ((Number(d.y) || 0) / maxVal) * activeHeight;
                const py = paddingTop + activeHeight - h;

                return (
                  <g key={i} className="group cursor-pointer">
                    <rect 
                      x={px} 
                      y={py} 
                      width={barWidth} 
                      height={Math.max(h, 2)} 
                      rx="2.5" 
                      fill="var(--color-primary, #22C55E)" 
                      opacity="0.85"
                      className="hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* Exact value text on top of bar */}
                    <text 
                      x={px + barWidth / 2} 
                      y={py - 3} 
                      fontSize="6" 
                      fontWeight="black" 
                      fill="var(--color-primary, #22C55E)" 
                      textAnchor="middle"
                    >
                      {Number(d.y).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </text>
                    {/* Tooltip value */}
                    <rect x={px + barWidth/2 - 25} y={py - 18} width="50" height="10" rx="1.5" fill="var(--color-surface-container-high, #1e293b)" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <text x={px + barWidth/2} y={py - 11} fontSize="5" fontWeight="bold" fill="var(--color-on-surface, #ffffff)" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {d.x}: {Number(d.y).toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between" style={{ paddingLeft: `${paddingLeft}px`, paddingRight: `${paddingRight}px` }}>
            {chartData.map((d, i) => (
              <span key={i} className="text-[8px] font-bold text-tertiary truncate text-center" style={{ width: `${activeWidth / chartData.length}px` }} title={d.x}>{d.x}</span>
            ))}
          </div>
        </div>
      );
    }

    // 3. Line Chart / 4. Area Chart
    if (chartType === "line" || chartType === "area") {
      const width = 300;
      const height = 120;
      const padding = 15;
      const activeWidth = width - padding * 2;
      const activeHeight = height - padding * 2;
      
      const points = chartData.map((d, i) => {
        const px = padding + (i / (chartData.length - 1 || 1)) * activeWidth;
        const py = padding + activeHeight - (d.y / maxVal) * activeHeight;
        return { x: px, y: py, val: d.y, label: d.x };
      });
      
      const polylinePoints = points.map((p: any) => `${p.x},${p.y}`).join(" ");
      const areaPath = points.length > 0 
        ? `M ${points[0].x} ${height - padding} ` + points.map((p: any) => `L ${p.x} ${p.y}`).join(" ") + ` L ${points[points.length - 1].x} ${height - padding} Z`
        : "";

      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between">
          <div className="flex-1 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
              {chartType === "area" && points.length > 0 && (
                <path d={areaPath} fill="url(#areaGrad)" opacity="0.3" />
              )}
              <polyline
                fill="none"
                stroke="var(--color-primary, #22C55E)"
                strokeWidth="3"
                points={polylinePoints}
              />
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary, #22C55E)" />
                  <stop offset="100%" stopColor="var(--color-primary, #22C55E)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {points.map((p: any, i: number) => (
                <g key={i} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="var(--color-primary, #22C55E)" strokeWidth="2" />
                  <text x={p.x} y={p.y - 8} fontSize="7" fontWeight="bold" fill="var(--color-primary, #22C55E)" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.val.toFixed(0)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="flex justify-between px-2">
            {chartData.map((d, i) => (
              <span key={i} className="text-[8px] font-bold text-tertiary truncate max-w-[35px]">{d.x}</span>
            ))}
          </div>
        </div>
      );
    }

    // 5. Pie Chart
    if (chartType === "pie") {
      const sliceColors = ["var(--color-primary, #22C55E)", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#14B8A6"];
      const total = chartData.reduce((acc, curr) => acc + (Number(curr.y) || 0), 0);
      
      let accumulatedAngle = 0;
      const slices = chartData.map((d, i) => {
        const val = Number(d.y) || 0;
        const percentage = total > 0 ? (val / total) * 100 : 0;
        const angle = total > 0 ? (val / total) * 360 : 0;
        const startAngle = accumulatedAngle;
        accumulatedAngle += angle;
        return { 
          name: d.x, 
          value: val, 
          percentage, 
          startAngle, 
          angle, 
          color: sliceColors[i % sliceColors.length] 
        };
      });

      // Circumference of radius 8 is 2 * Math.PI * 8 = 50.2655
      const C = 2 * Math.PI * 8;

      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 flex items-center justify-around">
          <div className="w-24 h-24 relative flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
              {slices.map((slice, idx) => {
                const strokeDasharray = `${(slice.percentage / 100) * C} ${((100 - slice.percentage) / 100) * C}`;
                const strokeDashoffset = -slice.startAngle / 360 * C;
                return (
                  <circle
                    key={idx}
                    cx="16"
                    cy="16"
                    r="8"
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="16"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="hover:scale-102 transition-transform origin-center cursor-pointer duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute w-12 h-12 bg-surface-container-low rounded-full flex flex-col items-center justify-center text-center p-1 shadow-md border border-outline-variant/20 z-10 pointer-events-none">
              <span className="text-[7px] text-tertiary font-bold uppercase tracking-wider leading-none">Total</span>
              <span className="text-[10px] font-black text-primary truncate max-w-full mt-0.5">{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[9px] font-bold text-on-surface-variant max-h-36 overflow-y-auto pr-2 custom-scrollbar">
            {slices.slice(0, 5).map((slice, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></span>
                <span className="truncate max-w-[100px]">{slice.name}: {slice.value.toLocaleString()} ({slice.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6. Scatter Plot
    if (chartType === "scatter") {
      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 relative">
          <div className="w-full h-36 border-b border-l border-outline-variant/30 relative mt-2 px-4">
            {chartData.map((d, i) => {
              const leftPct = 10 + (i / (chartData.length - 1 || 1)) * 80;
              const bottomPct = 10 + (d.y / maxVal) * 80;
              return (
                <div 
                  key={i} 
                  className="absolute w-3.5 h-3.5 rounded-full bg-primary/40 border border-primary flex items-center justify-center text-[7px] text-primary font-bold hover:scale-125 transition-transform cursor-pointer"
                  style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                  title={`${d.x}: ${d.y}`}
                >
                  ●
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] font-bold text-tertiary mt-2">
            <span>Low {x}</span>
            <span>High {x}</span>
          </div>
        </div>
      );
    }

    // 7. Heatmap Grid
    if (chartType === "heatmap") {
      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between">
          <div className="grid grid-cols-4 grid-rows-2 gap-2.5 h-36">
            {chartData.slice(0, 8).map((d, i) => {
              const opacity = 0.2 + (d.y / maxVal) * 0.8;
              return (
                <div 
                  key={i} 
                  className="rounded-lg flex flex-col justify-center items-center text-center p-1 text-[8px] font-bold transition-all duration-300 hover:scale-102"
                  style={{ backgroundColor: `rgba(34, 197, 94, ${opacity})`, color: opacity > 0.6 ? '#ffffff' : '#1e293b' }}
                >
                  <span className="truncate max-w-full">{d.x}</span>
                  <span className="text-[10px] mt-0.5">{d.y.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] text-tertiary font-bold text-center">Relative intensity correlates to {y}</span>
        </div>
      );
    }

    // 8. Radar Chart
    if (chartType === "radar") {
      const width = 300;
      const height = 180;
      const cx = width / 2;
      const cy = height / 2;
      const r = 60;
      
      const numPoints = chartData.length;
      if (numPoints > 0) {
        const angleStep = (2 * Math.PI) / numPoints;
        const webPaths: string[] = [];
        for (let level = 1; level <= 3; level++) {
          const radius = (r / 3) * level;
          const levelPoints = chartData.map((_: any, i: number) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            return `${x},${y}`;
          }).join(" ");
          webPaths.push(levelPoints);
        }
        
        const dataPoints = chartData.map((d: any, i: number) => {
          const angle = i * angleStep - Math.PI / 2;
          const radius = (d.y / maxVal) * r;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          return { x, y, name: d.x, value: d.y };
        });
        
        const dataPoly = dataPoints.map((p: any) => `${p.x},${p.y}`).join(" ");
        
        return (
          <div className="h-48 bg-surface-container-low rounded-xl p-4 flex items-center justify-center relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
              {webPaths.map((p: any, idx: number) => (
                <polygon key={idx} points={p} fill="none" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" strokeDasharray="2 2" />
              ))}
              {dataPoints.map((p: any, i: number) => {
                const angle = i * angleStep - Math.PI / 2;
                const ax = cx + r * Math.cos(angle);
                const ay = cy + r * Math.sin(angle);
                return (
                  <line key={i} x1={cx} y1={cy} x2={ax} y2={ay} stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" />
                );
              })}
              <polygon points={dataPoly} fill="rgba(34, 197, 94, 0.2)" stroke="var(--color-primary, #22C55E)" strokeWidth="1.5" />
              {dataPoints.map((p: any, i: number) => {
                const angle = i * angleStep - Math.PI / 2;
                const lx = cx + (r + 15) * Math.cos(angle);
                const ly = cy + (r + 10) * Math.sin(angle);
                return (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="2.5" fill="var(--color-primary, #22C55E)" />
                    <text x={lx} y={ly} fontSize="6" fontWeight="bold" fill="var(--color-tertiary, #5c5f61)" textAnchor="middle" alignmentBaseline="middle">
                      {p.name.substring(0, 8)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        );
      }
    }

    return (
      <div className="h-48 bg-surface-container-low rounded-xl flex flex-col items-center justify-center p-4">
        <span className="text-xs text-on-surface-variant font-medium">Standard aggregated visualization</span>
      </div>
    );
  };

  const handleSelectTemplate = async (templateType: string, overrideDatasetId?: string) => {
    const targetDatasetId = overrideDatasetId || datasetId;
    if (!targetDatasetId || !token || !projectId) return;
    setActiveTemplate(templateType);
    setLoadingDashboard(true);
    
    try {
      // 1. Check if dashboard already exists
      const listRes = await fetch(`${BACKEND_URL}/api/v1/dashboards/project/${projectId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      let dashboardId = null;
      if (listRes.ok) {
        const dashboardsList = await listRes.json();
        const existing = dashboardsList.find((d: any) => d.template_type === templateType && d.dataset_id === targetDatasetId);
        if (existing) {
          dashboardId = existing.id;
        }
      }
      
      // 2. Create if not exists
      if (!dashboardId) {
        const createRes = await fetch(`${BACKEND_URL}/api/v1/dashboards/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title: `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Summary`,
            template_type: templateType,
            dataset_id: targetDatasetId
          })
        });
        
        if (createRes.ok) {
          const newDash = await createRes.json();
          dashboardId = newDash.id;
        }
      }
      
      // 3. Load full dashboard with data aggregates
      if (dashboardId) {
        const dashRes = await fetch(`${BACKEND_URL}/api/v1/dashboards/${dashboardId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setActiveDashboard(dashData);
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const renderDashboardWidgetChart = (widget: any) => {
    const chartType = (widget.chart_type || "bar").toLowerCase();
    const data = widget.data || [];

    // 1. KPI Card
    if (chartType === "kpi") {
      const val = data[0]?.value ?? 0;
      const metric = widget.data_query?.y || widget.data_query?.metric || widget.title || "";
      const formattedVal = formatKpiValue(val, metric);
      const fontSizeClass = getKpiFontSize(formattedVal);
      return (
        <div className="p-4 bg-surface-container-low rounded-xl flex flex-col justify-center items-center text-center max-w-full overflow-hidden">
          <span className={`font-black text-primary tracking-tight ${fontSizeClass} truncate max-w-full break-all`}>{formattedVal}</span>
          <span className="text-[10px] text-tertiary font-bold mt-2 truncate max-w-full">Calculated Metric</span>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="h-48 bg-surface-container-low rounded-xl flex items-center justify-center text-center p-4">
          <span className="text-xs text-on-surface-variant font-medium">No aggregation data available</span>
        </div>
      );
    }

    const widgetValues = data.map((d: any) => Number(d.value) || 0);
    const maxVal = widgetValues.length > 0 ? Math.max(...widgetValues, 1) : 1;

    // 2. Bar Chart
    if (chartType === "bar") {
      const width = 300;
      const height = 120;
      const paddingLeft = 35;
      const paddingRight = 15;
      const paddingTop = 15;
      const paddingBottom = 15;
      const activeWidth = width - paddingLeft - paddingRight;
      const activeHeight = height - paddingTop - paddingBottom;

      const numTicks = 4;
      const ticks = Array.from({ length: numTicks + 1 }, (_, idx) => {
        const ratio = idx / numTicks;
        const val = maxVal * ratio;
        const yPos = paddingTop + activeHeight - ratio * activeHeight;
        return { label: formatMetricValueShort(val), y: yPos };
      });

      const slicedData = data.slice(0, 8);

      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between">
          <div className="flex-1 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
              {/* Horizontal Gridlines */}
              {ticks.map((t, idx) => (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={t.y} 
                    x2={width - paddingRight} 
                    y2={t.y} 
                    stroke="var(--color-outline-variant, #bccbb9)" 
                    strokeWidth="0.5" 
                    strokeOpacity="0.35" 
                    strokeDasharray="2 2" 
                  />
                  <text 
                    x={paddingLeft - 6} 
                    y={t.y} 
                    fontSize="6" 
                    fontWeight="bold" 
                    fill="var(--color-tertiary, #5c5f61)" 
                    textAnchor="end" 
                    alignmentBaseline="middle"
                  >
                    {t.label}
                  </text>
                </g>
              ))}

              {/* Bars and labels */}
              {slicedData.map((d: any, i: number) => {
                const barSpacing = activeWidth / (slicedData.length || 1);
                const barWidth = barSpacing * 0.6;
                const spacing = barSpacing * 0.4;
                const px = paddingLeft + i * barSpacing + spacing / 2;
                const h = ((Number(d.value) || 0) / maxVal) * activeHeight;
                const py = paddingTop + activeHeight - h;

                return (
                  <g key={i} className="group cursor-pointer">
                    <rect 
                      x={px} 
                      y={py} 
                      width={barWidth} 
                      height={Math.max(h, 2)} 
                      rx="2.5" 
                      fill="var(--color-primary, #22C55E)" 
                      opacity="0.85"
                      className="hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* Exact value text on top of bar */}
                    <text 
                      x={px + barWidth / 2} 
                      y={py - 3} 
                      fontSize="6" 
                      fontWeight="black" 
                      fill="var(--color-primary, #22C55E)" 
                      textAnchor="middle"
                    >
                      {Number(d.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </text>
                    {/* Tooltip value */}
                    <rect x={px + barWidth/2 - 25} y={py - 18} width="50" height="10" rx="1.5" fill="var(--color-surface-container-high, #1e293b)" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <text x={px + barWidth/2} y={py - 11} fontSize="5" fontWeight="bold" fill="var(--color-on-surface, #ffffff)" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {d.name}: {Number(d.value).toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between" style={{ paddingLeft: `${paddingLeft}px`, paddingRight: `${paddingRight}px` }}>
            {slicedData.map((d: any, i: number) => (
              <span key={i} className="text-[8px] font-bold text-tertiary truncate text-center" style={{ width: `${activeWidth / slicedData.length}px` }} title={d.name}>{d.name}</span>
            ))}
          </div>
        </div>
      );
    }

    // 3. Line Chart / 4. Area Chart
    if (chartType === "line" || chartType === "area") {
      const width = 300;
      const height = 120;
      const padding = 15;
      const activeWidth = width - padding * 2;
      const activeHeight = height - padding * 2;
      
      const points = data.slice(0, 8).map((d: any, i: number) => {
        const px = padding + (i / (Math.min(data.length, 8) - 1 || 1)) * activeWidth;
        const py = padding + activeHeight - (d.value / maxVal) * activeHeight;
        return { x: px, y: py, val: d.value, label: d.name };
      });
      
      const polylinePoints = points.map((p: any) => `${p.x},${p.y}`).join(" ");
      const areaPath = points.length > 0 
        ? `M ${points[0].x} ${height - padding} ` + points.map((p: any) => `L ${p.x} ${p.y}`).join(" ") + ` L ${points[points.length - 1].x} ${height - padding} Z`
        : "";

      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between">
          <div className="flex-1 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
              {chartType === "area" && points.length > 0 && (
                <path d={areaPath} fill="url(#dashAreaGrad)" opacity="0.3" />
              )}
              <polyline
                fill="none"
                stroke="var(--color-primary, #22C55E)"
                strokeWidth="3"
                points={polylinePoints}
              />
              <defs>
                <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary, #22C55E)" />
                  <stop offset="100%" stopColor="var(--color-primary, #22C55E)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {points.map((p: any, i: number) => (
                <g key={i} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="var(--color-primary, #22C55E)" strokeWidth="2" />
                  <text x={p.x} y={p.y - 8} fontSize="7" fontWeight="bold" fill="var(--color-primary, #22C55E)" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.val.toFixed(0)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="flex justify-between px-2">
            {data.slice(0, 8).map((d: any, i: number) => (
              <span key={i} className="text-[8px] font-bold text-tertiary truncate max-w-[35px]">{d.name}</span>
            ))}
          </div>
        </div>
      );
    }

    // 5. Pie Chart
    if (chartType === "pie") {
      const sliceColors = ["var(--color-primary, #22C55E)", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#14B8A6"];
      const total = data.reduce((acc: number, curr: any) => acc + (Number(curr.value) || 0), 0);
      
      let accumulatedAngle = 0;
      const slices = data.map((d: any, i: number) => {
        const val = Number(d.value) || 0;
        const percentage = total > 0 ? (val / total) * 100 : 0;
        const angle = total > 0 ? (val / total) * 360 : 0;
        const startAngle = accumulatedAngle;
        accumulatedAngle += angle;
        return { 
          name: d.name, 
          value: val, 
          percentage, 
          startAngle, 
          angle, 
          color: sliceColors[i % sliceColors.length] 
        };
      });

      // Circumference of radius 8 is 2 * Math.PI * 8 = 50.2655
      const C = 2 * Math.PI * 8;

      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 flex items-center justify-around">
          <div className="w-24 h-24 relative flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
              {slices.map((slice: any, idx: number) => {
                const strokeDasharray = `${(slice.percentage / 100) * C} ${((100 - slice.percentage) / 100) * C}`;
                const strokeDashoffset = -slice.startAngle / 360 * C;
                return (
                  <circle
                    key={idx}
                    cx="16"
                    cy="16"
                    r="8"
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="16"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="hover:scale-102 transition-transform origin-center cursor-pointer duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute w-12 h-12 bg-surface-container-low rounded-full flex flex-col items-center justify-center text-center p-1 shadow-md border border-outline-variant/20 z-10 pointer-events-none">
              <span className="text-[7px] text-tertiary font-bold uppercase tracking-wider leading-none">Total</span>
              <span className="text-[10px] font-black text-primary truncate max-w-full mt-0.5">{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[9px] font-bold text-on-surface-variant max-h-36 overflow-y-auto pr-2 custom-scrollbar">
            {slices.slice(0, 5).map((slice: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></span>
                <span className="truncate max-w-[100px]">{slice.name}: {slice.value.toLocaleString()} ({slice.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6. Scatter Plot
    if (chartType === "scatter") {
      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 relative">
          <div className="w-full h-36 border-b border-l border-outline-variant/30 relative mt-2 px-4">
            {data.slice(0, 15).map((d: any, i: number) => {
              const leftPct = 10 + (i / (Math.min(data.length, 15) - 1 || 1)) * 80;
              const bottomPct = 10 + (d.value / maxVal) * 80;
              return (
                <div 
                  key={i} 
                  className="absolute w-3.5 h-3.5 rounded-full bg-primary/40 border border-primary flex items-center justify-center text-[7px] text-primary font-bold hover:scale-125 transition-transform cursor-pointer"
                  style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                  title={`${d.name}: ${d.value}`}
                >
                  ●
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] font-bold text-tertiary mt-2">
            <span>Minimum values</span>
            <span>Maximum values</span>
          </div>
        </div>
      );
    }

    // 7. Heatmap Grid
    if (chartType === "heatmap") {
      return (
        <div className="h-48 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between">
          <div className="grid grid-cols-4 grid-rows-2 gap-2.5 h-36">
            {data.slice(0, 8).map((d: any, i: number) => {
              const opacity = 0.2 + (d.value / maxVal) * 0.8;
              return (
                <div 
                  key={i} 
                  className="rounded-lg flex flex-col justify-center items-center text-center p-1 text-[8px] font-bold transition-all duration-300 hover:scale-102"
                  style={{ backgroundColor: `rgba(34, 197, 94, ${opacity})`, color: opacity > 0.6 ? '#ffffff' : '#1e293b' }}
                >
                  <span className="truncate max-w-full">{d.name}</span>
                  <span className="text-[10px] mt-0.5">{d.value.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] text-tertiary font-bold text-center">Relative intensity correlates to value</span>
        </div>
      );
    }

    // 8. Radar Chart
    if (chartType === "radar") {
      const width = 300;
      const height = 180;
      const cx = width / 2;
      const cy = height / 2;
      const r = 60;
      
      const numPoints = data.length;
      if (numPoints > 0) {
        const angleStep = (2 * Math.PI) / numPoints;
        const webPaths: string[] = [];
        for (let level = 1; level <= 3; level++) {
          const radius = (r / 3) * level;
          const levelPoints = data.map((_: any, i: number) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            return `${x},${y}`;
          }).join(" ");
          webPaths.push(levelPoints);
        }
        
        const dataPoints = data.map((d: any, i: number) => {
          const angle = i * angleStep - Math.PI / 2;
          const radius = (d.value / maxVal) * r;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          return { x, y, name: d.name, value: d.value };
        });
        
        const dataPoly = dataPoints.map((p: any) => `${p.x},${p.y}`).join(" ");
        
        return (
          <div className="h-48 bg-surface-container-low rounded-xl p-4 flex items-center justify-center relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
              {webPaths.map((p: any, idx: number) => (
                <polygon key={idx} points={p} fill="none" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" strokeDasharray="2 2" />
              ))}
              {dataPoints.map((p: any, i: number) => {
                const angle = i * angleStep - Math.PI / 2;
                const ax = cx + r * Math.cos(angle);
                const ay = cy + r * Math.sin(angle);
                return (
                  <line key={i} x1={cx} y1={cy} x2={ax} y2={ay} stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" />
                );
              })}
              <polygon points={dataPoly} fill="rgba(34, 197, 94, 0.2)" stroke="var(--color-primary, #22C55E)" strokeWidth="1.5" />
              {dataPoints.map((p: any, i: number) => {
                const angle = i * angleStep - Math.PI / 2;
                const lx = cx + (r + 15) * Math.cos(angle);
                const ly = cy + (r + 10) * Math.sin(angle);
                return (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="2.5" fill="var(--color-primary, #22C55E)" />
                    <text x={lx} y={ly} fontSize="6" fontWeight="bold" fill="var(--color-tertiary, #5c5f61)" textAnchor="middle" alignmentBaseline="middle">
                      {p.name.substring(0, 8)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        );
      }
    }

    return (
      <div className="h-48 bg-surface-container-low rounded-xl flex flex-col items-center justify-center p-4">
        <span className="text-xs text-on-surface-variant font-medium">Standard aggregated visualization</span>
      </div>
    );
  };

  // Auto select default columns for visualizer when columns load
  useEffect(() => {
    if (columns.length > 0) {
      const numCols = columns.filter(c => rows.some(r => {
        const val = r[c];
        return typeof val === "number" || (!isNaN(Number(val)) && val !== null && val !== "");
      }));
      const catCols = columns.filter(c => !numCols.includes(c));
      
      setVisualizeXCol(catCols[0] || columns[0]);
      setVisualizeYCol(numCols[0] || columns[1] || columns[0]);
    }
  }, [columns, rows]);

  // Fetch visualizations helper
  const handleFetchVisualizations = async (generateInsights = false, generateStory = false) => {
    if (!datasetId || !token) return;
    setVisualizeLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/datasets/${datasetId}/visualize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          x: visualizeXCol,
          y: visualizeYCol,
          aggr: visualizeAggr,
          chart_type: visualizeChartType,
          generate_insights: generateInsights,
          generate_story: generateStory
        })
      });
      if (res.ok) {
        const result = await res.json();
        setVisualizeData(result.data || []);
        if (generateInsights) {
          setVisualizeInsights(result.insights || "");
          setActiveNarratorTab("insights");
        }
        if (generateStory) {
          setVisualizeStory(result.story || "");
          setActiveNarratorTab("story");
        }
      }
    } catch (err) {
      console.error("Visualizer API error:", err);
    } finally {
      setVisualizeLoading(false);
    }
  };

  // Re-fetch visualization data reactively when data queries change
  useEffect(() => {
    if (activeTab === "visualize" && datasetId && visualizeXCol && visualizeYCol) {
      setVisualizeInsights("");
      setVisualizeStory("");
      handleFetchVisualizations(false, false);
    }
  }, [activeTab, visualizeXCol, visualizeYCol, visualizeAggr, visualizeChartType, datasetId]);

  const getPaletteColors = (palette: string, count: number): string[] => {
    const palettes: Record<string, string[]> = {
      emerald: ["#10b981", "#059669", "#047857", "#065f46", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
      cyberpunk: ["#d946ef", "#06b6d4", "#a855f7", "#ec4899", "#3b82f6", "#f43f5e", "#8b5cf6", "#6366f1"],
      sunset: ["#f97316", "#ef4444", "#f59e0b", "#fb7185", "#fda4af", "#fecdd3", "#fee2e2", "#ffedd5"],
      amber: ["#f59e0b", "#d97706", "#b45309", "#78350f", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"],
      oceanic: ["#0284c7", "#0369a1", "#075985", "#0c4a6e", "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe"]
    };
    const selected = palettes[palette] || palettes.emerald;
    return Array.from({ length: count }, (_, i) => selected[i % selected.length]);
  };

  const renderInteractiveChart = () => {
    if (visualizeData.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-on-surface-variant font-medium">
          <span>Select your settings above and ensure a dataset is active to render visualizations.</span>
        </div>
      );
    }

    const maxVal = Math.max(...visualizeData.map(d => Number(d.value) || 0), 1);
    const colors = getPaletteColors(visualizeColor, visualizeData.length);

    // 1. Bar Chart
    if (visualizeChartType === "bar") {
      const width = 500;
      const height = 200;
      const paddingLeft = 45;
      const paddingRight = 20;
      const paddingTop = 15;
      const paddingBottom = 45; // Increased padding to fit rotated X-axis labels
      const activeWidth = width - paddingLeft - paddingRight;
      const activeHeight = height - paddingTop - paddingBottom;

      const numTicks = 4;
      const ticks = Array.from({ length: numTicks + 1 }, (_, idx) => {
        const ratio = idx / numTicks;
        const val = maxVal * ratio;
        const yPos = paddingTop + activeHeight - ratio * activeHeight;
        return { label: formatMetricValueShort(val), y: yPos };
      });

      return (
        <div className="h-64 flex flex-col justify-between p-4">
          <div className="flex-1 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
              {/* Horizontal Gridlines */}
              {ticks.map((t, idx) => (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={t.y} 
                    x2={width - paddingRight} 
                    y2={t.y} 
                    stroke="var(--color-outline-variant, #bccbb9)" 
                    strokeWidth="0.5" 
                    strokeOpacity="0.35" 
                    strokeDasharray="2 2" 
                  />
                  <text 
                    x={paddingLeft - 6} 
                    y={t.y} 
                    fontSize="7" 
                    fontWeight="bold" 
                    fill="var(--color-tertiary, #5c5f61)" 
                    textAnchor="end" 
                    alignmentBaseline="middle"
                  >
                    {t.label}
                  </text>
                </g>
              ))}

              {/* Bars and labels */}
              {visualizeData.map((d, i) => {
                const barSpacing = activeWidth / (visualizeData.length || 1);
                const barWidth = barSpacing * 0.6;
                const spacing = barSpacing * 0.4;
                const px = paddingLeft + i * barSpacing + spacing / 2;
                const h = ((Number(d.value) || 0) / maxVal) * activeHeight;
                const py = paddingTop + activeHeight - h;
                const barColor = colors[i % colors.length];

                // Collision avoidance: format values nicely, adjust size, or hide if too dense
                const barValStr = Number(d.value) >= 1000 
                  ? formatMetricValueShort(Number(d.value)) 
                  : Number(d.value).toLocaleString(undefined, { maximumFractionDigits: 0 });
                const showValue = visualizeData.length <= 15;
                const valueFontSize = visualizeData.length > 8 ? "5.5" : "7.5";

                return (
                  <g key={i} className="group cursor-pointer">
                    <rect 
                      x={px} 
                      y={py} 
                      width={barWidth} 
                      height={Math.max(h, 2)} 
                      rx="3" 
                      fill={barColor} 
                      opacity="0.85"
                      className="hover:opacity-100 transition-opacity duration-300"
                    />
                    
                    {/* Value text on top of bar */}
                    {showValue && (
                      <text 
                        x={px + barWidth / 2} 
                        y={py - 4} 
                        fontSize={valueFontSize} 
                        fontWeight="black" 
                        fill={barColor} 
                        textAnchor="middle"
                      >
                        {barValStr}
                      </text>
                    )}

                    {/* X Axis rotated labels inside SVG */}
                    <text
                      x={px + barWidth / 2}
                      y={paddingTop + activeHeight + 12}
                      fontSize={visualizeData.length > 12 ? "5" : "6"}
                      fontWeight="bold"
                      fill="var(--color-tertiary, #5c5f61)"
                      textAnchor="end"
                      transform={`rotate(-35, ${px + barWidth / 2}, ${paddingTop + activeHeight + 12})`}
                    >
                      {d.name.length > 15 ? d.name.substring(0, 12) + "..." : d.name}
                    </text>

                    {/* Tooltip value */}
                    <rect x={px + barWidth/2 - 35} y={py - 22} width="70" height="14" rx="2" fill="var(--color-surface-container-high, #1e293b)" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <text x={px + barWidth/2} y={py - 13} fontSize="6" fontWeight="bold" fill="var(--color-on-surface, #ffffff)" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {d.name}: {Number(d.value).toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      );
    }

    // 2. Line Chart / 7. Area Chart
    if (visualizeChartType === "line" || visualizeChartType === "area") {
      const width = 500;
      const height = 200;
      const padding = 25;
      const activeWidth = width - padding * 2;
      const activeHeight = height - padding * 2;
      
      const points = visualizeData.map((d, i) => {
        const px = padding + (i / (visualizeData.length - 1 || 1)) * activeWidth;
        const py = padding + activeHeight - (d.value / maxVal) * activeHeight;
        return { x: px, y: py, val: d.value, label: d.name };
      });
      
      const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
      const areaPath = points.length > 0 
        ? `M ${points[0].x} ${height - padding} ` + points.map((p) => `L ${p.x} ${p.y}`).join(" ") + ` L ${points[points.length - 1].x} ${height - padding} Z`
        : "";

      return (
        <div className="h-64 flex flex-col justify-between p-4">
          <div className="flex-1 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
              {/* Gridlines */}
              {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                const y = padding + activeHeight - ratio * activeHeight;
                return (
                  <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="3 3" />
                );
              })}
              
              {visualizeChartType === "area" && points.length > 0 && (
                <path d={areaPath} fill={`url(#visualizeAreaGrad_${visualizeColor})`} opacity="0.35" />
              )}
              
              <polyline
                fill="none"
                stroke={colors[0]}
                strokeWidth="3.5"
                points={polylinePoints}
              />
              <defs>
                <linearGradient id={`visualizeAreaGrad_${visualizeColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[0]} />
                  <stop offset="100%" stopColor={colors[0]} stopOpacity="0" />
                </linearGradient>
              </defs>
              {points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={colors[i % colors.length]} strokeWidth="3" />
                  <rect x={p.x - 20} y={p.y - 25} width="40" height="15" rx="3" fill="var(--color-surface-container-high, #1e293b)" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  <text x={p.x} y={p.y - 15} fontSize="7" fontWeight="bold" fill="var(--color-on-surface, #ffffff)" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.val.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="flex justify-between px-6">
            {visualizeData.map((d, i) => (
              <span key={i} className="text-[8px] font-bold text-tertiary truncate max-w-[45px]" title={d.name}>{d.name}</span>
            ))}
          </div>
        </div>
      );
    }

    // 3. Pie Chart / 4. Doughnut Chart
    if (visualizeChartType === "pie" || visualizeChartType === "doughnut") {
      const isDoughnut = visualizeChartType === "doughnut";
      const total = visualizeData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
      
      let accumulatedAngle = 0;
      const slices = visualizeData.map((d, i) => {
        const val = Number(d.value) || 0;
        const percentage = total > 0 ? (val / total) * 100 : 0;
        const angle = total > 0 ? (val / total) * 360 : 0;
        const startAngle = accumulatedAngle;
        accumulatedAngle += angle;
        return { name: d.name, value: val, percentage, startAngle, angle, color: colors[i % colors.length] };
      });

      const r = isDoughnut ? 10.5 : 8;
      const strokeW = isDoughnut ? 11 : 16;
      const C = 2 * Math.PI * r;

      return (
        <div className="h-64 flex items-center justify-around p-4">
          <div className="w-40 h-40 relative flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
              {slices.map((slice, idx) => {
                const strokeDasharray = `${(slice.percentage / 100) * C} ${((100 - slice.percentage) / 100) * C}`;
                const strokeDashoffset = -slice.startAngle / 360 * C;
                return (
                  <circle
                    key={idx}
                    cx="16"
                    cy="16"
                    r={r}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={strokeW}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="hover:scale-102 transition-all cursor-pointer origin-center duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute w-24 h-24 bg-surface-container-lowest rounded-full border border-outline-variant/30 flex flex-col items-center justify-center text-center p-2 shadow-inner z-10 pointer-events-none">
              <span className="text-[9px] text-tertiary font-bold uppercase tracking-wider">Total</span>
              <span className="text-sm font-black text-primary truncate max-w-full">{total.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[9px] font-bold text-on-surface-variant max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {slices.map((slice, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></span>
                <span className="truncate max-w-[120px]">{slice.name}: {slice.value.toLocaleString()} ({slice.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. Scatter Plot
    if (visualizeChartType === "scatter") {
      return (
        <div className="h-64 p-4 relative">
          <div className="w-full h-48 border-b border-l border-outline-variant/30 relative mt-2 px-6">
            {/* Grid background lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => (
              <div 
                key={idx} 
                className="absolute left-0 right-0 border-t border-outline-variant/10 border-dashed"
                style={{ bottom: `${ratio * 100}%` }}
              ></div>
            ))}
            {visualizeData.map((d, i) => {
              const leftPct = 10 + (i / (visualizeData.length - 1 || 1)) * 80;
              const bottomPct = 10 + (d.value / maxVal) * 80;
              return (
                <div 
                  key={i} 
                  className="absolute w-4 h-4 rounded-full border flex items-center justify-center text-[7px] font-bold hover:scale-125 hover:z-20 transition-transform cursor-pointer shadow-sm group"
                  style={{ left: `${leftPct}%`, bottom: `${bottomPct}%`, backgroundColor: `${colors[i % colors.length]}55`, borderColor: colors[i % colors.length] }}
                >
                  <div className="absolute -top-7 bg-surface-container-high text-on-surface border border-outline-variant/40 rounded px-1.5 py-0.5 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm whitespace-nowrap">
                    {d.name}: {d.value.toLocaleString()}
                  </div>
                  ●
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] font-bold text-tertiary mt-2 px-2">
            <span>Minimum Index</span>
            <span>Maximum Index</span>
          </div>
        </div>
      );
    }

    // 6. Radar Chart
    if (visualizeChartType === "radar") {
      const width = 300;
      const height = 180;
      const cx = width / 2;
      const cy = height / 2;
      const r = 60;
      
      const numPoints = visualizeData.length;
      const angleStep = (2 * Math.PI) / numPoints;
      const webPaths: string[] = [];
      for (let level = 1; level <= 3; level++) {
        const radius = (r / 3) * level;
        const levelPoints = visualizeData.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          return `${x},${y}`;
        }).join(" ");
        webPaths.push(levelPoints);
      }
      
      const dataPoints = visualizeData.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const radius = (d.value / maxVal) * r;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        return { x, y, name: d.name, value: d.value, color: colors[i % colors.length] };
      });
      
      const dataPoly = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");
      
      return (
        <div className="h-64 flex items-center justify-center p-4 relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-auto h-full max-h-56">
            {webPaths.map((p, idx) => (
              <polygon key={idx} points={p} fill="none" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" strokeDasharray="2 2" />
            ))}
            {dataPoints.map((p, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const ax = cx + r * Math.cos(angle);
              const ay = cy + r * Math.sin(angle);
              return (
                <line key={i} x1={cx} y1={cy} x2={ax} y2={ay} stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" />
              );
            })}
            <polygon points={dataPoly} fill={`${colors[0]}22`} stroke={colors[0]} strokeWidth="2" />
            {dataPoints.map((p, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const lx = cx + (r + 15) * Math.cos(angle);
              const ly = cy + (r + 10) * Math.sin(angle);
              return (
                <g key={i} className="group">
                  <circle cx={p.x} cy={p.y} r="3" fill={p.color} stroke="white" strokeWidth="1" />
                  <rect x={p.x - 20} y={p.y - 20} width="40" height="12" rx="2" fill="var(--color-surface-container-high, #1e293b)" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="0.5" className="opacity-0 group-hover:opacity-100 transition-opacity animate-none" />
                  <text x={p.x} y={p.y - 12} fontSize="6" fontWeight="bold" fill="var(--color-on-surface, #ffffff)" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.value.toLocaleString()}
                  </text>
                  <text x={lx} y={ly} fontSize="6" fontWeight="bold" fill="var(--color-tertiary, #5c5f61)" textAnchor="middle" alignmentBaseline="middle">
                    {p.name.substring(0, 8)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    // 8. Heatmap Grid
    if (visualizeChartType === "heatmap") {
      return (
        <div className="h-64 flex flex-col justify-between p-6">
          <div className="grid grid-cols-4 grid-rows-3 gap-3 h-48">
            {visualizeData.slice(0, 12).map((d, i) => {
              const opacity = 0.25 + (d.value / maxVal) * 0.75;
              const textColor = opacity > 0.6 ? '#ffffff' : 'var(--color-on-surface, #1e293b)';
              return (
                <div 
                  key={i} 
                  className="rounded-xl flex flex-col justify-center items-center text-center p-2 text-[9px] font-bold shadow-sm transition-all duration-300 hover:scale-105 hover:brightness-105 cursor-pointer group relative"
                  style={{ backgroundColor: colors[i % colors.length] + Math.round(opacity * 255).toString(16).padStart(2, '0') }}
                >
                  <div className="absolute -top-7 bg-surface-container-high text-on-surface border border-outline-variant/40 rounded px-1.5 py-0.5 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm whitespace-nowrap z-20">
                    {d.name}: {d.value.toLocaleString()}
                  </div>
                  <span className="truncate max-w-full" style={{ color: textColor }}>{d.name}</span>
                  <span className="text-xs mt-1" style={{ color: textColor }}>{d.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
              );
            })}
          </div>
          <span className="text-[8px] text-tertiary font-bold text-center">Color opacity represents relative metric intensity</span>
        </div>
      );
    }

    return null;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      
      {/* Sidebar Navigation Drawer Backdrop for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Sidebar Navigation */}
      <aside className={`bg-surface-container-lowest h-screen w-64 fixed left-0 top-0 border-r border-outline-variant/30 flex flex-col pb-6 shadow-sm z-50 no-print transition-transform duration-300 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="h-16 flex items-center justify-between pl-7 pr-4 border-b border-outline-variant/30 mb-6">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src={isDarkMode ? "/logo-horizontal-dark.svg" : "/logo-horizontal-light.svg"} alt="NeuronDash Logo" className="h-9 w-auto object-contain cursor-pointer" />
          </Link>
          {/* Mobile drawer close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl cursor-pointer flex items-center justify-center min-h-[40px] min-w-[40px]"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="space-y-1">
          <button
            onClick={() => { setActiveTab("chat"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors cursor-pointer border-l-4 ${
              activeTab === "chat"
                ? "text-primary border-primary bg-surface-container-low font-bold"
                : "text-on-surface-variant border-transparent hover:bg-surface-container-low"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">AI Insights</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsMobileMenuOpen(false);
              if (datasetId && !activeDashboard) {
                handleSelectTemplate(activeTemplate || "auto");
              }
            }}
            disabled={!datasetId}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors cursor-pointer border-l-4 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "dashboard"
                ? "text-primary border-primary bg-surface-container-low font-bold"
                : "text-on-surface-variant border-transparent hover:bg-surface-container-low"
            }`}
            title={!datasetId ? "Upload a file to activate analytics" : "View Bento Dashboards"}
          >
            <Activity className="w-5 h-5" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("visualize");
              setIsMobileMenuOpen(false);
            }}
            disabled={!datasetId}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors cursor-pointer border-l-4 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "visualize"
                ? "text-primary border-primary bg-surface-container-low font-bold"
                : "text-on-surface-variant border-transparent hover:bg-surface-container-low"
            }`}
            title={!datasetId ? "Upload a file to activate visualization" : "Interactive Visualizer"}
          >
            <LineChart className="w-5 h-5" />
            <span className="text-sm">Visualize</span>
          </button>
          <button
            onClick={() => {
              setIsDataPanelOpen(!isDataPanelOpen);
              setIsMobileMenuOpen(false);
            }}
            disabled={!datasetId}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors cursor-pointer border-l-4 disabled:opacity-40 disabled:cursor-not-allowed ${
              isDataPanelOpen && datasetId
                ? "text-primary border-primary bg-surface-container-low font-bold"
                : "text-on-surface-variant border-transparent hover:bg-surface-container-low"
            }`}
            title={!datasetId ? "Upload a file to view library data" : "Toggle Data Library preview panel"}
          >
            <Database className="w-5 h-5" />
            <span className="text-sm">Data Table</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("report");
              setIsMobileMenuOpen(false);
            }}
            disabled={!datasetId}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors cursor-pointer border-l-4 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "report"
                ? "text-primary border-primary bg-surface-container-low font-bold"
                : "text-on-surface-variant border-transparent hover:bg-surface-container-low"
            }`}
            title={!datasetId ? "Upload a file to view detailed report" : "View Detailed Report"}
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">Reports</span>
          </button>
        </nav>

        {/* Dashboard Templates Sidebar Section */}
        {datasetId && (
          <div className="px-6 pt-4 border-t border-outline-variant/20 mt-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider block mb-3">Dashboard Templates</span>
            <div className="space-y-1">
              {[
                { type: "auto", label: "AI Auto-Dash", icon: "🤖" },
                { type: "executive", label: "Executive Summary", icon: "📊" },
                { type: "sales", label: "Sales Pipeline", icon: "📈" },
                { type: "student", label: "Student Progress", icon: "🎓" },
                { type: "hr", label: "HR Talent Metrics", icon: "👥" },
                { type: "finance", label: "Corporate Finance", icon: "💰" },
                { type: "survey", label: "Survey Feedback", icon: "📝" },
              ].map((t) => (
                <button
                  key={t.type}
                  onClick={() => {
                    setActiveTab("dashboard");
                    handleSelectTemplate(t.type);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    activeTab === "dashboard" && activeTemplate === t.type
                      ? "bg-primary text-white font-bold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="px-6 mt-auto">
          <div className="pt-4 border-t border-outline-variant/30">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-2.5 text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-full text-left font-semibold py-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help Center</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
            {/* Main Content Area */}
      <main className="ml-0 md:ml-64 flex-1 flex flex-col h-full bg-background relative">
        
        {/* Top AppBar */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center h-16 px-6 no-print">
          <div className="flex items-center gap-2">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-xl cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px] mr-1"
              title="Open Navigation"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <span className="font-bold text-base md:text-lg text-on-surface truncate max-w-[120px] sm:max-w-none">Data Analysis Engine</span>
            <div className="h-4 w-px bg-outline-variant/30 hidden sm:block"></div>
            <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary hidden sm:inline-block">Interactive Sandbox</span>
          </div>

          {/* Tab Switcher - Hidden on mobile, shown on desktop */}
          <div className="hidden md:flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/30">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              AI Insights
            </button>
            <button
              onClick={() => {
                setActiveTab("dashboard");
                if (datasetId && !activeDashboard) {
                  handleSelectTemplate(activeTemplate || "auto");
                }
              }}
              disabled={!datasetId}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={!datasetId ? "Upload a dataset first to enable Dashboards" : "View Bento Dashboards"}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab("visualize");
              }}
              disabled={!datasetId}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "visualize"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={!datasetId ? "Upload a dataset first to enable Visualizations" : "Interactive Visualizer"}
            >
              Visualize
            </button>
            <button
              onClick={() => {
                setActiveTab("report");
              }}
              disabled={!datasetId}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "report"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={!datasetId ? "Upload a dataset first to enable Reports" : "Detailed Report"}
            >
              Reports
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 bg-surface-container-high border border-outline-variant/30 rounded-xl hover:bg-surface-container-highest text-on-surface-variant transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[38px] min-w-[38px] sm:min-h-none sm:min-w-none"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <span className="text-xs font-bold hidden sm:inline">☀️ Light Mode</span> : <span className="text-xs font-bold hidden sm:inline">🌙 Dark Mode</span>}
              {isDarkMode ? <span className="sm:hidden text-xs">☀️</span> : <span className="sm:hidden text-xs">🌙</span>}
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center font-bold text-sm text-primary">
              ND
            </div>
          </div>
        </header>

        {/* Central Workspace Grid */}
        <div className="mt-16 flex-1 flex overflow-hidden">
                 {/* Chat Pane */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 pb-36">
              <div className="max-w-3xl mx-auto w-full space-y-6">
                
                {/* File Upload Zone */}
                {uploadStatus !== "completed" && (
                  <div 
                    onClick={triggerFileInput}
                    className="drag-dash rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-surface-container-low transition-all cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".csv,.xlsx,.pdf,.docx"
                    />
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">Upload Source File</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Select Excel, CSV, PDF, or Word table files to begin profiling.</p>
                    </div>
                    
                    {uploadStatus === "uploading" && (
                      <div className="w-full max-w-xs space-y-2">
                        <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full bg-primary-container transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="text-xs text-primary font-semibold">Extracting data rows ({progressPercent}%)</span>
                      </div>
                    )}
                    
                    {uploadError && (
                      <p className="text-sm text-error font-medium">{uploadError}</p>
                    )}
                  </div>
                )}

                {/* Chat Thread */}
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          AI
                        </div>
                      )}
                      
                      <div className="space-y-3 max-w-[80%]">
                        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                          msg.role === "user" 
                            ? "bg-primary text-white rounded-tr-none" 
                            : "bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-tl-none"
                        }`}>
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>

                        {/* Processing status blocks */}
                        {msg.steps && (
                          <div className="glass-card p-3.5 rounded-xl border-l-4 border-primary space-y-2 text-xs">
                            <span className="font-bold text-primary uppercase tracking-widest text-[9px]">ENGINE WORKFLOW</span>
                            <div className="grid grid-cols-2 gap-2 text-on-surface-variant font-medium">
                              {msg.steps.map((st, sidx) => (
                                <div key={sidx} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                  <span>{st.step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Embed Dynamic Widget configuration output */}
                        {msg.widget && (
                          <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-on-surface">{msg.widget.title}</span>
                              <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-full">
                                {msg.widget.chart_type?.toUpperCase() || "CHART"}
                              </span>
                            </div>
                            
                            {renderWidgetChart(msg.widget)}
                          </div>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center font-bold text-xs text-on-surface">
                          ME
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatBottomRef}></div>
                </div>

              </div>
            </div>
          )}

          {/* Dashboard Pane */}
          {(activeTab === "dashboard" || activeTab === "report") && (
            <div className={`flex-1 flex flex-col h-full overflow-y-auto p-8 pb-12 ${activeTab !== "dashboard" ? "hidden print:flex" : "flex"}`}>
              <div className="max-w-6xl mx-auto w-full space-y-8">
                
                {/* Printable Header - Only visible during print */}
                <div className="hidden print:block mb-8 border-b-2 border-primary/20 pb-4">
                  <h1 className="text-3xl font-black text-primary">NeuronDash Intelligence Analytics Report</h1>
                  <p className="text-sm font-bold text-tertiary uppercase mt-1">Generated by Intelligence OS • {activeDashboard?.title || "Data Analysis Dashboard"}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Dataset rows: {totalRows} • Date: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Dashboard Title & Templates List */}
                <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 space-y-4 shadow-sm no-print">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Analytics Dashboard</h2>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Select from our 7 intelligence templates to dynamically aggregate your dataset.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeDashboard && (
                        <>
                          <button
                            onClick={() => window.print()}
                            className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <span>Download PDF Report</span>
                          </button>
                          <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                            Active: {activeDashboard.title}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Template Selectors Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {[
                      { type: "executive", label: "Executive", icon: "📊" },
                      { type: "sales", label: "Sales", icon: "📈" },
                      { type: "student", label: "Student", icon: "🎓" },
                      { type: "hr", label: "HR", icon: "👥" },
                      { type: "finance", label: "Finance", icon: "💰" },
                      { type: "survey", label: "Survey", icon: "📝" },
                      { type: "auto", label: "AI Auto", icon: "🤖" },
                    ].map((t) => (
                      <button
                        key={t.type}
                        onClick={() => handleSelectTemplate(t.type)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                          activeTemplate === t.type
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-102"
                            : "bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-lowest"
                        }`}
                      >
                        <span className="text-lg">{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dashboard Widgets Bento Grid */}
                {loadingDashboard ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-4 bg-surface-container-low/50 rounded-3xl border border-outline-variant/30">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-primary">Compiling aggregations & rendering dashboard...</span>
                  </div>
                ) : activeDashboard && activeDashboard.widgets && activeDashboard.widgets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {activeDashboard.widgets.map((widget: any, index: number) => {
                      // Bento pattern spans
                      let colSpan = "md:col-span-6";
                      if (index === 0) colSpan = "md:col-span-8";
                      else if (index === 1) colSpan = "md:col-span-4";
                      else if (index === 2) colSpan = "md:col-span-4";
                      else if (index === 3) colSpan = "md:col-span-8";
                      else if (index === 4) colSpan = "md:col-span-12";
                      else if (index === 5) colSpan = "md:col-span-6";
                      else if (index === 6) colSpan = "md:col-span-6";

                      return (
                        <div 
                          key={widget.id} 
                          className={`${colSpan} bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-extrabold text-sm text-on-surface tracking-tight">{widget.title}</h3>
                              <p className="text-[10px] text-tertiary font-bold mt-0.5">
                                Aggregating: {widget.data_query?.y || widget.data_query?.metric || "records"} by {widget.data_query?.x || "category"}
                              </p>
                            </div>
                            <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                              {widget.chart_type}
                            </span>
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center">
                            {renderDashboardWidgetChart(widget)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center p-8 bg-surface-container-low/50 rounded-3xl border border-outline-variant/30 text-center">
                    <Database className="w-12 h-12 text-tertiary mb-3" />
                    <h3 className="font-bold text-on-surface">No dashboard generated yet</h3>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-sm">Select one of the 7 intelligence templates above to load aggregated insights from your uploaded file.</p>
                  </div>
                )}
                
              </div>
            </div>
          )}

          {activeTab === "visualize" && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 pb-12 animate-fade-in">
              <div className="max-w-6xl mx-auto w-full space-y-8">
                
                {/* Visualizer Controls Grid */}
                <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 grid grid-cols-1 lg:grid-cols-12 gap-6 shadow-sm">
                  
                  {/* 1. Chart Type Selector (Col-Span 5) */}
                  <div className="lg:col-span-5 space-y-3">
                    <span className="text-xs font-bold text-tertiary uppercase tracking-wider block">Chart Type</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: "bar", label: "Bar Chart", icon: "📊" },
                        { type: "line", label: "Line Chart", icon: "📈" },
                        { type: "pie", label: "Pie Chart", icon: "🍕" },
                        { type: "doughnut", label: "Doughnut", icon: "🍩" },
                        { type: "scatter", label: "Scatter Plot", icon: "🎯" },
                        { type: "radar", label: "Radar Chart", icon: "🕸️" },
                        { type: "area", label: "Area Chart", icon: "🌊" },
                        { type: "heatmap", label: "Heatmap Grid", icon: "🔥" },
                      ].map((c) => (
                        <button
                          key={c.type}
                          onClick={() => setVisualizeChartType(c.type)}
                          className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                            visualizeChartType === c.type
                              ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                              : "bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
                          }`}
                        >
                          <span className="text-sm">{c.icon}</span>
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Data Settings (Col-Span 4) */}
                  <div className="lg:col-span-4 space-y-3">
                    <span className="text-xs font-bold text-tertiary uppercase tracking-wider block">Data Settings</span>
                    
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant block mb-1">X-Axis Column</label>
                        <select
                          value={visualizeXCol}
                          onChange={(e) => setVisualizeXCol(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant block mb-1">Y-Axis Column</label>
                        <select
                          value={visualizeYCol}
                          onChange={(e) => setVisualizeYCol(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-on-surface-variant block mb-1">Aggregation</label>
                          <select
                            value={visualizeAggr}
                            onChange={(e) => setVisualizeAggr(e.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-2 py-2 text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                          >
                            <option value="sum">Sum</option>
                            <option value="avg">Average</option>
                            <option value="count">Count</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-on-surface-variant block mb-1">Color Palette</label>
                          <select
                            value={visualizeColor}
                            onChange={(e) => setVisualizeColor(e.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-2 py-2 text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                          >
                            <option value="emerald">Emerald</option>
                            <option value="cyberpunk">Cyberpunk</option>
                            <option value="sunset">Sunset</option>
                            <option value="amber">Amber Glow</option>
                            <option value="oceanic">Oceanic</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. AI Narrator Actions (Col-Span 3) */}
                  <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-tertiary uppercase tracking-wider block">AI Narrator</span>
                      <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                        Generate descriptive business insights or narrative stories regarding your visual configurations.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleFetchVisualizations(true, false)}
                        disabled={visualizeLoading}
                        className="w-full bg-primary hover:bg-primary/95 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span>🧠 Generate AI Insights</span>
                      </button>
                      <button
                        onClick={() => handleFetchVisualizations(false, true)}
                        disabled={visualizeLoading}
                        className="w-full bg-surface-container-highest border border-outline-variant/30 hover:bg-surface-container-high disabled:opacity-50 text-on-surface py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span>📖 Explain AI Story</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Main Visualizer Rendering & Insights Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Visual Chart Display (Col Span 8) */}
                  <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-extrabold text-base text-on-surface tracking-tight">Custom Visualization</h3>
                        <p className="text-[10px] text-tertiary font-bold mt-0.5 uppercase tracking-wider">
                          {visualizeAggr} of {visualizeYCol} by {visualizeXCol} ({visualizeChartType})
                        </p>
                      </div>
                      <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        Live Aggregate
                      </span>
                    </div>

                    {visualizeLoading && visualizeData.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-semibold text-primary">Computing data points...</span>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center">
                        {renderInteractiveChart()}
                      </div>
                    )}
                  </div>

                  {/* Right Column: AI Narrator Insights Box (Col Span 4) */}
                  <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[400px]">
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
                        <span className="font-extrabold text-sm text-on-surface">AI Narrator</span>
                        <div className="flex bg-surface-container-high p-0.5 rounded-lg border border-outline-variant/30 text-[10px] font-bold">
                          <button
                            onClick={() => setActiveNarratorTab("insights")}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              activeNarratorTab === "insights" ? "bg-primary text-white" : "text-on-surface-variant"
                            }`}
                          >
                            Insights
                          </button>
                          <button
                            onClick={() => setActiveNarratorTab("story")}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              activeNarratorTab === "story" ? "bg-primary text-white" : "text-on-surface-variant"
                            }`}
                          >
                            Story
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[300px] text-xs leading-relaxed text-on-surface-variant custom-scrollbar pr-1">
                        {visualizeLoading ? (
                          <div className="h-48 flex flex-col items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-bold text-tertiary">Analyzing data...</span>
                          </div>
                        ) : activeNarratorTab === "insights" ? (
                          visualizeInsights ? (
                            <div className="markdown-body whitespace-pre-wrap">{visualizeInsights}</div>
                          ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-center text-[10px] text-tertiary font-bold gap-2">
                              <span>No insights computed yet.</span>
                              <button
                                onClick={() => handleFetchVisualizations(true, false)}
                                className="text-primary hover:underline cursor-pointer"
                              >
                                Click here to generate
                              </button>
                            </div>
                          )
                        ) : (
                          visualizeStory ? (
                            <div className="markdown-body whitespace-pre-wrap">{visualizeStory}</div>
                          ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-center text-[10px] text-tertiary font-bold gap-2">
                              <span>No story generated yet.</span>
                              <button
                                onClick={() => handleFetchVisualizations(false, true)}
                                className="text-primary hover:underline cursor-pointer"
                              >
                                Click here to explain
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {(activeTab === "report" || activeTab === "dashboard") && (
            <div className={`flex-1 flex flex-col h-full overflow-y-auto p-8 pb-12 animate-fade-in print-page-break ${activeTab !== "report" ? "hidden print:flex" : "flex"}`}>
              <div className="max-w-6xl mx-auto w-full space-y-8">
                
                {/* Printable Header */}
                <div className="hidden print:block mb-8 border-b-2 border-primary/20 pb-4">
                  <h1 className="text-3xl font-black text-primary">NeuronDash Dataset Audit & Diagnostic Report</h1>
                  <p className="text-sm font-bold text-tertiary uppercase mt-1">Generated by Intelligence OS • {datasetInfo?.name || "Data Diagnostics"}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Rows: {totalRows} • Columns: {columns.length} • Date: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Dashboard Title & Actions */}
                <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm no-print">
                  <div>
                    <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Dataset Health Report</h2>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">Complete structural profile, data hygiene diagnostic, and summary statistics of your dataset.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Print / Save PDF</span>
                    </button>
                  </div>
                </div>

                {datasetInfo ? (
                  <>
                    {/* Data Quality & Profile Summary Cards */}
                    {(() => {
                      const stats = datasetInfo.summary_statistics || {};
                      const statKeys = Object.keys(stats);
                      const totalNulls = statKeys.reduce((acc, key) => acc + (stats[key].null_count || 0), 0);
                      const totalCells = totalRows * statKeys.length;
                      const completenessScore = totalCells > 0 ? ((totalCells - totalNulls) / totalCells) * 100 : 100;
                      
                      const radius = 36;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (completenessScore / 100) * circumference;

                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Circular Completeness Score (Col-span 4) */}
                          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
                            <h3 className="text-xs font-extrabold text-tertiary uppercase tracking-wider mb-4">Overall Data Hygiene</h3>
                            <div className="relative w-28 h-28 flex items-center justify-center">
                              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-outline-variant, #bccbb9)" strokeWidth="6" strokeOpacity="0.15" />
                                <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-primary, #22C55E)" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
                              </svg>
                              <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-on-surface">{completenessScore.toFixed(1)}%</span>
                                <span className="text-[7px] text-tertiary font-bold uppercase tracking-wider mt-0.5">Completeness</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-on-surface-variant font-medium mt-4 leading-relaxed max-w-[200px]">
                              {totalNulls === 0 
                                ? "Your dataset contains zero null or missing values. Perfect completion rate." 
                                : `Your dataset contains ${totalNulls.toLocaleString()} missing values out of ${(totalCells).toLocaleString()} total data cells.`}
                            </p>
                          </div>

                          {/* Profile Overview (Col-span 8) */}
                          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                            <h3 className="text-xs font-extrabold text-tertiary uppercase tracking-wider mb-4">Dataset Profile Metadata</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col justify-center">
                                <span className="text-[9px] text-tertiary font-bold uppercase tracking-wider">File Name</span>
                                <span className="text-sm font-black text-on-surface truncate mt-1 shadow-none" title={datasetInfo.name}>{datasetInfo.name}</span>
                              </div>
                              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col justify-center">
                                <span className="text-[9px] text-tertiary font-bold uppercase tracking-wider">Total Rows</span>
                                <span className="text-base font-black text-primary mt-1">{totalRows.toLocaleString()}</span>
                              </div>
                              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col justify-center">
                                <span className="text-[9px] text-tertiary font-bold uppercase tracking-wider">Total Columns</span>
                                <span className="text-base font-black text-primary mt-1">{statKeys.length}</span>
                              </div>
                              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col justify-center">
                                <span className="text-[9px] text-tertiary font-bold uppercase tracking-wider">Missing Values</span>
                                <span className={`text-base font-black mt-1 ${totalNulls > 0 ? "text-error" : "text-primary"}`}>{totalNulls.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold text-on-surface-variant">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span>Clean status: {anomalies.length > 0 ? `${anomalies.length} unresolved anomalies flagged` : "Optimal hygiene detected"}</span>
                              </div>
                              <span>Profile initialized on {new Date(datasetInfo.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                        </div>
                      );
                    })()}

                    {/* Column Profile Table / Search */}
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                        <div>
                          <h3 className="font-extrabold text-sm text-on-surface tracking-tight">Column-by-Column Structural Profiles</h3>
                          <p className="text-[10px] text-tertiary font-bold mt-0.5">Explore datatype assertions, completeness ratios, and localized metric distribution calculations.</p>
                        </div>
                        
                        {/* Search Column Input */}
                        <div className="relative bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 flex items-center gap-2 w-full sm:max-w-xs shadow-sm">
                          <Search className="w-3.5 h-3.5 text-tertiary" />
                          <input 
                            type="text"
                            placeholder="Filter columns..."
                            value={reportSearch}
                            onChange={(e) => setReportSearch(e.target.value)}
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-on-surface font-semibold"
                          />
                          {reportSearch && (
                            <button onClick={() => setReportSearch("")} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Columns Grid list */}
                      <div className="space-y-4 overflow-hidden">
                        {(() => {
                          const stats = datasetInfo.summary_statistics || {};
                          const statKeys = Object.keys(stats);
                          const filtered = statKeys.filter(col => col.toLowerCase().includes(reportSearch.toLowerCase()));

                          if (filtered.length === 0) {
                            return (
                              <div className="p-8 text-center text-xs text-on-surface-variant font-semibold">
                                No columns match your filter criteria.
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible print:pr-0">
                              {filtered.map((col) => {
                                const info = stats[col];
                                const isNumeric = info.inferred_type === "numeric";
                                const isCategorical = info.inferred_type === "categorical";
                                const isIdentifier = info.inferred_type === "identifier";
                                const isDatetime = info.inferred_type === "datetime";
                                const colCompleteness = 100 - (info.null_percentage || 0);

                                return (
                                  <div key={col} className="p-5 bg-surface-container-low/60 hover:bg-surface-container-low border border-outline-variant/20 rounded-2xl flex flex-col md:flex-row justify-between gap-4 transition-all print:bg-white print:border print:border-slate-200">
                                    {/* Name & Data Type Badge */}
                                    <div className="space-y-2 max-w-sm w-full">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-sm text-on-surface tracking-tight break-all">{col}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                          isNumeric 
                                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                                            : isCategorical 
                                            ? "bg-purple-500/10 text-purple-500 border-purple-500/20" 
                                            : isIdentifier
                                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                            : isDatetime
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                        }`}>
                                          {info.inferred_type || "empty"}
                                        </span>
                                      </div>
                                      
                                      {/* Completeness Bar */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                                          <span>Completeness Rate</span>
                                          <span className={colCompleteness > 90 ? "text-primary" : colCompleteness > 50 ? "text-amber-500" : "text-error"}>
                                            {colCompleteness.toFixed(1)}% ({info.null_count === 0 ? "No Nulls" : `${info.null_count} Nulls`})
                                          </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-500 ${
                                            colCompleteness > 90 
                                              ? "bg-primary" 
                                              : colCompleteness > 50 
                                              ? "bg-amber-500" 
                                              : "bg-error"
                                          }`} style={{ width: `${colCompleteness}%` }}></div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Statistical Measures */}
                                    <div className="flex-1 bg-surface-container-lowest border border-outline-variant/15 p-4 rounded-xl flex flex-col justify-center text-xs text-on-surface-variant font-semibold shadow-inner print:bg-slate-50 print:border-slate-200 overflow-hidden">
                                      {isNumeric ? (
                                        <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
                                          <div className="grid grid-cols-5 gap-3 text-center min-w-[550px]">
                                            <div className="flex flex-col p-1">
                                              <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Minimum</span>
                                              <span className="text-on-surface font-black mt-1 whitespace-nowrap">{info.min !== null ? info.min.toLocaleString(undefined, {maximumFractionDigits: 2}) : "N/A"}</span>
                                            </div>
                                            <div className="flex flex-col p-1">
                                              <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Median</span>
                                              <span className="text-on-surface font-black mt-1 whitespace-nowrap">{info.median !== null ? info.median.toLocaleString(undefined, {maximumFractionDigits: 2}) : "N/A"}</span>
                                            </div>
                                            <div className="flex flex-col p-1">
                                              <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Average</span>
                                              <span className="text-on-surface font-black mt-1 text-primary whitespace-nowrap">{info.mean !== null ? info.mean.toLocaleString(undefined, {maximumFractionDigits: 2}) : "N/A"}</span>
                                            </div>
                                            <div className="flex flex-col p-1">
                                              <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Maximum</span>
                                              <span className="text-on-surface font-black mt-1 whitespace-nowrap">{info.max !== null ? info.max.toLocaleString(undefined, {maximumFractionDigits: 2}) : "N/A"}</span>
                                            </div>
                                            <div className="flex flex-col p-1">
                                              <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Std Dev</span>
                                              <span className="text-on-surface font-black mt-1 whitespace-nowrap">{info.std !== null ? info.std.toLocaleString(undefined, {maximumFractionDigits: 2}) : "N/A"}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ) : isIdentifier ? (
                                        <div className="grid grid-cols-2 gap-3 text-center lg:text-left">
                                          <div className="flex flex-col">
                                            <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Unique Keys</span>
                                            <span className="text-on-surface font-black mt-1 whitespace-nowrap">{info.unique_count !== undefined ? info.unique_count.toLocaleString() : "N/A"}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Top ID Example</span>
                                            <span className="text-primary font-black mt-1 truncate" title={info.top_value}>
                                              "{info.top_value || "N/A"}"
                                            </span>
                                          </div>
                                        </div>
                                      ) : isDatetime ? (
                                        <div className="flex flex-wrap gap-4 text-center lg:text-left justify-around lg:justify-start">
                                          <div className="flex flex-col min-w-[100px] flex-1">
                                            <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Start Date (Min)</span>
                                            <span className="text-on-surface font-black mt-1 whitespace-nowrap">{info.min || "N/A"}</span>
                                          </div>
                                          <div className="flex flex-col min-w-[100px] flex-1">
                                            <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">End Date (Max)</span>
                                            <span className="text-on-surface font-black mt-1 whitespace-nowrap">{info.max || "N/A"}</span>
                                          </div>
                                          <div className="flex flex-col min-w-[80px] flex-1">
                                            <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Distinct Dates</span>
                                            <span className="text-primary font-black mt-1 whitespace-nowrap">{info.unique_count !== undefined ? info.unique_count.toLocaleString() : "N/A"}</span>
                                          </div>
                                        </div>
                                      ) : isCategorical ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                          <div className="flex flex-col text-center lg:text-left">
                                            <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Unique Categories</span>
                                            <span className="text-on-surface font-black mt-1 whitespace-nowrap">{info.unique_count?.toLocaleString() || "N/A"}</span>
                                          </div>
                                          <div className="flex flex-col lg:col-span-2 text-center lg:text-left">
                                            <span className="text-[8px] font-extrabold text-tertiary uppercase tracking-wider whitespace-nowrap">Most Frequent Class (Mode)</span>
                                            <span className="text-primary font-black mt-1 truncate max-w-full" title={info.top_value}>
                                              "{info.top_value || "N/A"}" <span className="text-[10px] text-tertiary font-bold">({info.top_frequency?.toLocaleString()} times)</span>
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center text-tertiary italic text-xs py-1">
                                          No statistics calculable for empty column.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center p-8 bg-surface-container-low/50 rounded-3xl border border-outline-variant/30 text-center">
                    <Database className="w-12 h-12 text-tertiary mb-3 animate-pulse" />
                    <h3 className="font-bold text-on-surface">No profile reports loaded</h3>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-sm">Please upload a source file to compile structures and run full quality diagnostics on your data.</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Right Sidebar: Data Preview Panel */}
          {isDataPanelOpen && datasetId && (
            <>
              {/* Mobile backdrop for preview sidebar */}
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden"
                onClick={() => setIsDataPanelOpen(false)}
              ></div>
              <aside className="w-full sm:w-112 md:w-96 bg-surface-container-lowest border-l border-outline-variant/30 flex flex-col h-screen md:h-full z-50 md:z-10 fixed md:relative right-0 top-0 shadow-2xl md:shadow-none transition-all duration-300 no-print">
              
              <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Cleaned Dataset</span>
                </div>
                <button 
                  onClick={() => setIsDataPanelOpen(false)} 
                  className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-1 rounded text-lg flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search filter input */}
              <div className="p-3 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2">
                <Search className="w-4 h-4 text-tertiary" />
                <input 
                  type="text"
                  placeholder="Filter table rows..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-on-surface font-semibold"
                />
                {tableSearch && (
                  <button onClick={() => setTableSearch("")} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-container-lowest shadow-sm z-10">
                    <tr>
                      {columns.map((col) => (
                        <th 
                          key={col} 
                          onClick={() => handleHeaderClick(col)}
                          className="p-3 text-[10px] font-bold text-tertiary uppercase border-b border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col}</span>
                            {sortColumn === col && (
                              <span className="text-[10px] text-primary">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs text-on-surface-variant">
                    {filteredAndSortedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low border-b border-outline-variant/10">
                        {columns.map((col) => (
                          <td key={col} className="p-3 font-medium truncate max-w-[120px]">
                            {row[col] === null ? <span className="text-error bg-error/10 px-1 py-0.5 rounded font-bold">NULL</span> : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Anomalies and Outliers review */}
              {anomalies.length > 0 && (
                <div className="p-4 bg-error/5 border-t border-error/20 space-y-3">
                  <div className="flex items-center gap-2 text-error">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-wider">Review Anomalies ({anomalies.length})</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    I detected duplicate entries and numeric values out of expected bounds.
                  </p>
                  <button 
                    onClick={triggerAutoClean}
                    className="w-full py-2.5 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition-colors shadow-sm"
                  >
                    Apply Cleaning Suggestions
                  </button>
                </div>
              )}

              <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low flex justify-between items-center text-xs">
                <span className="font-semibold text-tertiary">Rows: {filteredAndSortedRows.length} of {totalRows}</span>
                <button 
                  onClick={() => fetchPreview(datasetId)}
                  className="px-3 py-1.5 border border-outline-variant/50 hover:bg-surface-container-high rounded font-semibold transition-colors cursor-pointer"
                >
                  Refresh Data
                </button>
              </div>

            </aside>
          </>
        )}

        </div>

        {/* Input Bar (Floating Footer) */}
        {activeTab === "chat" && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none z-30 no-print">
            <div className="max-w-3xl mx-auto w-full pointer-events-auto space-y-4">
              
              {/* Suggested prompts pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Calculate average values",
                  "Flag outliers & anomalies",
                  "Plot categorical column counts",
                  "Summarize overall findings"
                ].map((p, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="px-4 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-all shadow-sm"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Prompt input field */}
              <div className="relative bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-2 shadow-lg flex items-end gap-2">
                <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask my AI to profile metrics, find correlation details, or query anomalies..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 py-2.5 text-sm resize-none max-h-32 text-on-surface"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isProcessing}
                  className="bg-primary text-white p-3 rounded-xl hover:opacity-95 transition-all flex items-center justify-center shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-center text-[9px] text-tertiary font-bold tracking-widest uppercase">
                NeuronDash Assistant v4.2 | Local Processing Mode
              </p>
            </div>
          </div>
        )}

        {/* Help Center Modal */}
        {isHelpOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] no-print">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-250">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg text-on-surface">Help Center</h3>
                </div>
                <button 
                  onClick={() => { setIsHelpOpen(false); setActiveHelpIdx(null); }} 
                  className="text-on-surface-variant hover:text-on-surface cursor-pointer p-1 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {[
                  {
                    q: "How do I upload a dataset?",
                    a: "You can click on the central dashed upload zone in the AI Assistant tab to browse your local computer or drag and drop any CSV, Excel, PDF, or Word data file directly."
                  },
                  {
                    q: "How do I query the AI Assistant chatbot?",
                    a: "Type your questions in natural language in the chat input (e.g., 'Show average GPA' or 'Is there any correlation between Age and Attendance?'). The AI will analyze columns and respond with calculations."
                  },
                  {
                    q: "How do I build custom charts in the Visualizer?",
                    a: "Switch to the 'Interactive Visualizer' tab. In the control sidebar, select your X-axis (category), Y-axis (metric), aggregation rule (Sum, Average, or Count), and select one of the 8 available chart types."
                  },
                  {
                    q: "What does the 'Detailed Report' completeness gauge mean?",
                    a: "The completeness score is calculated dynamically by evaluating the ratio of non-null cells to the total number of cells in the active dataset, displaying overall data hygiene."
                  },
                  {
                    q: "How can I export my workspace findings?",
                    a: "In the 'Detailed Report' tab, click the 'Download PDF Report' button in the upper right. This will format the screen for standard printer layouts, hiding controls and sidebar menus for clean output."
                  },
                  {
                    q: "Which file formats are supported?",
                    a: "NeuronDash supports CSV (.csv), Excel (.xlsx, .xls), PDF documents, and Word documents (.docx) for dataset uploading and structural analysis."
                  },
                  {
                    q: "Where is my dataset stored and is it secure?",
                    a: "All dataset uploads are processed locally on the server or on your machine. We do not store or transmit raw data to any external third-party cloud database without your explicit settings."
                  },
                  {
                    q: "How can I filter or clean my data?",
                    a: "Under the 'Detailed Report' and 'Interactive Visualizer' views, the system automatically checks for duplicates, outliers, and missing values, presenting cleanup recommendations in the sidebar."
                  },
                  {
                    q: "Can I change the application theme?",
                    a: "Yes! You can toggle between Light and Dark mode using the sun/moon icon located at the right side of the top header bar."
                  }
                ].map((item, idx) => {
                  const isOpen = activeHelpIdx === idx;
                  return (
                    <div 
                      key={idx} 
                      className="border border-outline-variant/20 rounded-2xl overflow-hidden bg-surface-container-low transition-colors"
                    >
                      <button
                        onClick={() => setActiveHelpIdx(isOpen ? null : idx)}
                        className="w-full px-5 py-4 text-left font-bold text-xs flex justify-between items-center text-on-surface hover:text-primary transition-colors cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <span className="text-primary text-sm font-bold">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/10 pt-3 bg-surface-container-lowest">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center text-[10px] text-tertiary font-bold uppercase tracking-wider">
                <span>NeuronDash Helpdesk</span>
                <a href="mailto:writetoaloktripathi@gmail.com" className="text-primary hover:underline">
                  Support Email
                </a>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
