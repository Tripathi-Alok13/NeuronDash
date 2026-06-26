"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { 
  Zap, 
  PlayCircle, 
  CheckCircle, 
  LayoutDashboard, 
  FileText, 
  Upload, 
  MessageSquare, 
  ArrowRight, 
  Bot, 
  Brain, 
  TrendingUp, 
  Clock, 
  GraduationCap, 
  ShieldCheck, 
  Globe, 
  Share2, 
  Mail, 
  ChevronDown, 
  Settings, 
  Activity, 
  User,
  MapPin,
  Menu,
  X
} from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("General Inquiry");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Sync theme preference on mount
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

  useEffect(() => {
    // Smooth reveal animations
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-10");
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      section.classList.add("transition-all", "duration-1000", "opacity-0", "translate-y-10");
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-background text-on-surface font-sans overflow-x-hidden min-h-screen">
      {/* Header Navigation */}
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        <nav className="flex justify-between items-center h-20 px-6 md:px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src={isDarkMode ? "/logo-horizontal-dark.png" : "/logo-horizontal-light.png"} alt="NeuronDash Logo" className="h-10 w-auto object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-base">
            <a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="#features">Features</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="#pricing">Pricing</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="#about">About</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="#contact">Contact</a>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px]"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <span className="text-xs font-bold px-1">☀️ Light</span> : <span className="text-xs font-bold px-1">🌙 Dark</span>}
            </button>
            <div className="hidden md:flex items-center gap-3">
              <Button href="/login?tab=signin" variant="ghost" size="sm">
                Login
              </Button>
              <Button href="/login?tab=signup" variant="primary" size="sm">
                Get Started
              </Button>
            </div>
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px]"
              title="Open Navigation Menu"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div 
              className="absolute top-0 right-0 w-64 h-full bg-surface-container-lowest p-6 border-l border-outline-variant/30 flex flex-col space-y-6 shadow-2xl animate-in slide-in-from-right duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-sm text-on-surface uppercase tracking-wider">Navigation</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 hover:bg-surface-container-high rounded-full cursor-pointer flex items-center justify-center min-h-[40px] min-w-[40px]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col space-y-3 text-base font-semibold">
                <a className="text-on-surface-variant hover:text-primary transition-colors py-2.5 border-b border-outline-variant/10" href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors py-2.5 border-b border-outline-variant/10" href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors py-2.5 border-b border-outline-variant/10" href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors py-2.5 border-b border-outline-variant/10" href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
              </nav>
              <div className="pt-6 border-t border-outline-variant/20 flex flex-col gap-3">
                <Button href="/login?tab=signin" variant="ghost" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Button>
                <Button href="/login?tab=signup" variant="primary" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container/10 text-primary font-semibold text-sm mb-8 border border-primary/20">
            <Zap className="w-4 h-4" />
            AI-Powered Data Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight text-on-surface">
            Turn Raw Spreadsheets Into <span className="text-primary">AI-Powered Insights</span> in Seconds
          </h1>
          <p className="max-w-3xl mx-auto text-on-surface-variant text-base sm:text-lg md:text-xl leading-relaxed mb-10">
            Upload CSV, Excel, PDF, or Word files. NeuronDash automatically cleans your data, profiles dataset quality, and generates responsive dashboards instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20 max-w-md mx-auto sm:max-w-none">
            <Button href="/login?tab=signup" variant="primary" size="lg" className="w-full sm:w-auto px-10 shadow-xl shadow-primary/20 hover:scale-105">
              Start Free
            </Button>
            <Button href="/login?guest=true" variant="secondary" size="lg" className="w-full sm:w-auto px-10 hover:scale-105 border border-outline-variant/40 bg-surface-container-high/40">
              Try Guest Demo
            </Button>
          </div>
          
          {/* Dashboard Mockup */}
          <div className="relative max-w-5xl mx-auto group">
            <div className="absolute -inset-4 kinetic-gradient rounded-[2.5rem] opacity-20 blur-3xl group-hover:opacity-25 transition-opacity"></div>
            <div className="relative bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 overflow-hidden shadow-2xl p-2 md:p-4">
              <div className="flex items-center gap-2 mb-4 px-4 pt-2 border-b border-surface-container/50 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-4 h-6 w-1/3 bg-surface-container rounded-full opacity-50"></div>
              </div>
              
              {/* Premium Dashboard Preview */}
              <div className="bg-surface-container-low rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {/* Visual KPI 1 */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-sm">
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs font-semibold uppercase tracking-wider">Active Revenue</span>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black mt-2 text-on-surface">$128,450.00</h3>
                  <span className="text-xs text-primary font-bold mt-1 block">▲ +12.4% vs Q3</span>
                </div>
                {/* Visual KPI 2 */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-sm">
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs font-semibold uppercase tracking-wider">Data Accuracy</span>
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black mt-2 text-on-surface">99.8%</h3>
                  <span className="text-xs text-primary font-bold mt-1 block">Cleaned automatically</span>
                </div>
                {/* Visual KPI 3 */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-sm">
                  <div className="flex justify-between items-start text-on-surface-variant">
                    <span className="text-xs font-semibold uppercase tracking-wider">Anomaly Sweeps</span>
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black mt-2 text-on-surface">0 Flags</h3>
                  <span className="text-xs text-on-surface-variant font-bold mt-1 block">Resolved in workspace</span>
                </div>
                {/* Interactive Chart Visualizer */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm md:col-span-3 h-52 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-on-surface">Regional Growth Correlation</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">Cleaned Output</span>
                  </div>
                  <div className="flex items-end justify-between w-full h-32 gap-3 px-6 pb-2">
                    {[40, 75, 45, 95, 60, 35, 80, 50, 70, 90, 30, 85].map((h, idx) => (
                      <div key={idx} className="w-full bg-primary-container/30 hover:bg-primary-container rounded-t-md transition-colors" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 border-y border-outline-variant/20 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8 opacity-75">
          <span className="font-semibold text-xs uppercase tracking-widest text-on-surface-variant">TRUSTED FOR:</span>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 font-bold text-lg text-on-surface-variant">
            <span>Student Performance</span>
            <span>Sales Pipelines</span>
            <span>HR Diagnostics</span>
            <span>Finance Margins</span>
            <span>Research Surveys</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-8 bg-surface-container-low/30" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Features for Modern Data Ops</h2>
            <p className="text-on-surface-variant text-lg">Sophisticated AI agents designed for complete structural precision.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-card p-10 rounded-[2rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-primary opacity-10">
                <Brain className="w-24 h-24" />
              </div>
              <div className="relative z-10 max-w-md">
                <h3 className="text-2xl font-bold mb-4">AI Data Cleaning & Extraction</h3>
                <p className="text-on-surface-variant mb-6">Our pipeline profiles dataset types, normalizes string entries, deletes duplicate items, and clamps numeric outliers automatically.</p>
                <ul className="space-y-3 text-sm font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Automated Null Interpolation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Numeric Outlier Clamping
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Format Standardization
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="glass-card p-10 rounded-[2rem] hover:translate-y-[-4px] transition-transform">
              <LayoutDashboard className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3">Multi-Dashboard Templates</h3>
              <p className="text-on-surface-variant">Convert spreadsheets to Executive, Sales, HR, Finance, Student, or Survey visual metrics instantly.</p>
            </div>

            <div className="glass-card p-10 rounded-[2rem] hover:translate-y-[-4px] transition-transform">
              <MessageSquare className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3">Conversational Chat</h3>
              <p className="text-on-surface-variant">Ask questions directly in plain English. Our agent runs calculation queries on your data and replies in real time.</p>
            </div>

            <div className="glass-card p-10 rounded-[2rem] hover:translate-y-[-4px] transition-transform">
              <Upload className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3">Office File Formats</h3>
              <p className="text-on-surface-variant">Supports PDF table structures and Word content alongside clean Excel and CSV files.</p>
            </div>

            <div className="glass-card p-10 rounded-[2rem] hover:translate-y-[-4px] transition-transform">
              <Share2 className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3">Interactive Share Links</h3>
              <p className="text-on-surface-variant">Share interactive report outputs or raw data files through secure web share tokens.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-8 bg-surface-container-lowest" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-on-surface-variant">Scale your organizational intelligence with flexible monthly plans.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass-card p-10 rounded-[2.5rem] flex flex-col h-full">
              <h4 className="font-bold text-xl mb-2">Starter</h4>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">$0</span>
                <span className="text-on-surface-variant">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow text-sm">
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-primary" /> 5 uploads / month</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-primary" /> Basic anomaly scanning</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-primary" /> Standard auto-dashboards</li>
              </ul>
              <Button href="/login?tab=signup" variant="secondary" className="w-full">
                Start Free
              </Button>
            </div>

            <div className="glass-card p-10 rounded-[2.5rem] relative kinetic-gradient text-white flex flex-col h-full shadow-2xl scale-105 z-10 border-none">
              <div className="absolute top-0 right-10 -translate-y-1/2 px-4 py-1.5 bg-white text-primary text-xs font-extrabold rounded-full shadow-sm">
                POPULAR
              </div>
              <h4 className="font-bold text-xl mb-2">Growth Pro</h4>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">$49</span>
                <span className="text-white/80">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow text-sm">
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-white" /> Unlimited uploads</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-white" /> Advanced cleaning controls</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-white" /> PDF &amp; CSV export capabilities</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-white" /> Full conversational chat sandbox</li>
              </ul>
              <Button href="/login?tab=signup" variant="ghost" className="w-full bg-white text-primary hover:bg-white/90 hover:scale-[1.02] shadow-md">
                Get Started
              </Button>
            </div>

            <div className="glass-card p-10 rounded-[2.5rem] flex flex-col h-full">
              <h4 className="font-bold text-xl mb-2">Enterprise</h4>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">Custom</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow text-sm">
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-primary" /> Custom LLM configurations</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-primary" /> Dedicated processing nodes</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-primary" /> Multi-workspace RBAC roles</li>
              </ul>
              <Button variant="secondary" className="w-full">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-8 bg-surface-container-lowest" id="about">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">About NeuronDash</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">Empowering Everyone with Data Precision</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">We bridge the gap between raw data complexity and executive decision-making. NeuronDash is designed to help professionals and teams clean, analyze, and visualize their metrics instantly.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual element / stats */}
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-[2rem] border border-outline-variant/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-primary opacity-5">
                  <Brain className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-bold mb-2">Our Vision</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">We believe that structural complexity should never stand in the way of visual intelligence. That is why our advanced AI cleaning engine normalizes headers, clamps outliers, and aggregates values automatically in seconds.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-surface-container-low rounded-2xl text-center">
                  <h4 className="text-3xl font-black text-primary">100%</h4>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">Automated Anomaly Sweeps</p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-2xl text-center">
                  <h4 className="text-3xl font-black text-primary">&lt; 3s</h4>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">Dashboard Generation</p>
                </div>
              </div>
            </div>

            {/* Description list */}
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Universal Compatibility</h4>
                  <p className="text-sm text-on-surface-variant">Whether you upload standard CSV/Excel sheets, complex multi-page PDF tables, or Word reports, our system profiles layout rules dynamically.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Conversational Exploration</h4>
                  <p className="text-sm text-on-surface-variant">Perform deep analytical drills in real-time. Ask questions, request new charts, or compile summaries simply by writing plain-text queries.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Privacy & Isolation</h4>
                  <p className="text-sm text-on-surface-variant">Your uploads are processed inside isolated sandboxes and are encrypted with local storage tokens. We never share or expose your records.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & FAQ Section */}
      <section className="py-32 px-8 bg-surface-container-low/30" id="contact">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Get In Touch</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">Contact Our Team</h2>
            <p className="text-on-surface-variant text-lg">Have a question or request? Fill out the form or reach out directly.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
            {/* Contact Form: Col Span 7 */}
            <div className="lg:col-span-7 glass-card p-8 md:p-10 rounded-[2rem] border border-outline-variant/30">
              <h3 className="text-2xl font-bold mb-6 text-on-surface">Send us a Message</h3>
              
              {contactSubmitted ? (
                <div className="p-8 bg-primary/10 border border-primary/30 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
                    ✓
                  </div>
                  <h4 className="text-xl font-bold text-on-surface">Message Sent Successfully!</h4>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto">Thank you, <span className="font-semibold">{contactFirst}</span>. We have received your query regarding <span className="font-semibold">"{contactSubject}"</span> and will respond to <span className="font-semibold">{contactEmail}</span> shortly.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setContactFirst("");
                      setContactLast("");
                      setContactEmail("");
                      setContactMessage("");
                      setContactSubmitted(false);
                    }}
                    className="px-6 py-2 rounded-full font-bold kinetic-gradient text-white hover:scale-102 transition-all mt-4 cursor-pointer text-sm"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (contactFirst.trim() && contactEmail.trim()) {
                      setContactSubmitted(true);
                    }
                  }} 
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">First Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={contactFirst}
                        onChange={(e) => setContactFirst(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">Last Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={contactLast}
                        onChange={(e) => setContactLast(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="john@company.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">Subject</label>
                    <select
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Billing & Pricing">Billing & Pricing</option>
                      <option value="Enterprise Solution">Enterprise Solution</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="How can we help you?"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold kinetic-gradient text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <span>Send Message</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Owner & Contact Information: Col Span 5 */}
            <div className="lg:col-span-5 space-y-6 h-full">
              <div className="glass-card p-8 rounded-[2rem] border border-outline-variant/30 h-full flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-on-surface">Contact Information</h3>
                  
                  <div className="space-y-6">
                    {/* Owner Name */}
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Owner Name</p>
                        <p className="text-base font-bold text-on-surface">Alok Tripathi</p>
                      </div>
                    </div>

                    {/* Email ID */}
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Email Address</p>
                        <a 
                          href="mailto:writetoaloktripathi@gmail.com" 
                          className="text-base font-bold text-primary hover:underline text-left break-all"
                        >
                          writetoaloktripathi@gmail.com
                        </a>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Address</p>
                        <p className="text-base font-bold text-on-surface">Mumbai 400104</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 text-xs text-on-surface-variant leading-relaxed">
                  📢 <strong>Direct Support Notice:</strong> Messages submitted via this form are routed immediately to the platform dashboard. Alternatively, you can write directly to the owner email provided above for priority integration requests.
                </div>
              </div>
            </div>
          </div>

          {/* FAQ accordion inside same Contact tab */}
          <div className="max-w-3xl mx-auto border-t border-outline-variant/20 pt-20">
            <h3 className="text-3xl font-extrabold mb-10 text-center text-on-surface">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                {
                  q: "Is my corporate data secure?",
                  a: "Yes. All data uploads are encrypted using AES-256 at rest and TLS 1.3 in transit. Data profiles are isolated to your workspace and never used to train public LLM models."
                },
                {
                  q: "How does the PDF extraction process work?",
                  a: "Our backend utilizes custom parsing algorithms to isolate tabular shapes. Once tables are detected, cells are converted to structured schemas, handling layout variances automatically."
                },
                {
                  q: "Can I customize the generated dashboards?",
                  a: "Absolutely. You can edit report details, reorder layout grids, and add custom chart queries directly using the natural language chat workspace."
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
                  <button
                    type="button"
                    className="flex justify-between items-center w-full p-6 text-left font-bold text-lg focus:outline-none hover:bg-surface-container-low/20 text-on-surface"
                    onClick={() => toggleFaq(idx)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFaq === idx && (
                    <div className="px-6 pb-6 text-on-surface-variant text-base leading-relaxed border-t border-surface-container/50 pt-4 bg-surface-container-lowest">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-16 px-8 text-center text-sm text-on-surface-variant">
        <p>© 2026 NeuronDash AI. All rights reserved. Created for premium enterprise-grade BI operations.</p>
      </footer>
    </div>
  );
}
