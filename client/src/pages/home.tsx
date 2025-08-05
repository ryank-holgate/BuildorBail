import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertAppIdeaSchema, type InsertAppIdea, type ValidationResultWithIdea } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";


export default function Home() {
  const [currentResult, setCurrentResult] = useState<ValidationResultWithIdea | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [timeSaved, setTimeSaved] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [animateVerdict, setAnimateVerdict] = useState(false);
  const [flipCards, setFlipCards] = useState([false, false, false, false]);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [expandedActionCard, setExpandedActionCard] = useState<string | null>(null);
  const { toast } = useToast();

  const brutalMessages = [
    "Crushing your dreams...",
    "Finding fatal flaws...",
    "Checking for market reality...",
    "Analyzing competition...",
    "Calculating failure probability...",
    "Destroying delusions...",
    "Seeking harsh truths...",
    "Reality-checking commence...",
  ];

  const form = useForm({
    resolver: zodResolver(insertAppIdeaSchema.pick({ 
      appName: true, 
      description: true, 
      targetMarket: true, 
      budget: true 
    })),
    defaultValues: {
      appName: "",
      description: "",
      targetMarket: "",
      budget: "",
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (data: any): Promise<ValidationResultWithIdea & { brutalAnalysis?: any }> => {
      const transformedData = {
        appName: data.appName,
        description: data.description,
        targetMarket: data.targetMarket,
        budget: data.budget,
        agreeToTerms: true,
      };
      
      const response = await apiRequest("POST", "/api/analyze", transformedData);
      return response.json();
    },
    onSuccess: (result) => {
      setCurrentResult(result);
      setIsLoading(false);
      // Use the actual time saved from brutal analysis, or fallback to random
      const actualTimeSaved = result.brutalAnalysis?.time_saved_hours || Math.floor(Math.random() * 120) + 40;
      setTimeSaved(actualTimeSaved);
      
      // Dramatic result reveal animation sequence
      setTimeout(() => {
        setShowResults(true);
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
      setTimeout(() => {
        setAnimateVerdict(true);
      }, 1000);
      
      // Flip cards one by one for dramatic effect
      setTimeout(() => setFlipCards([true, false, false, false]), 1500);
      setTimeout(() => setFlipCards([true, true, false, false]), 2000);
      setTimeout(() => setFlipCards([true, true, true, false]), 2500);
      setTimeout(() => setFlipCards([true, true, true, true]), 3000);
    },
    onError: (error) => {
      console.error("Validation error:", error);
      setIsLoading(false);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to destroy your app idea. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    setIsLoading(true);
    setCurrentResult(null);
    
    // Cycle through brutal messages
    let messageIndex = 0;
    setLoadingMessage(brutalMessages[0]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % brutalMessages.length;
      setLoadingMessage(brutalMessages[messageIndex]);
    }, 2000);
    
    validateMutation.mutate(data);
    
    // Clean up interval when done
    setTimeout(() => clearInterval(messageInterval), 15000);
  };

  const handleValidateAnother = () => {
    setCurrentResult(null);
    setIsLoading(false);
    setShowResults(false);
    setAnimateVerdict(false);
    setFlipCards([false, false, false, false]);
    setShowActionPlan(false);
    setExpandedActionCard(null);
    form.reset();
    
    setTimeout(() => {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "BUILD":
        return "text-green-400";
      case "BAIL":
        return "text-red-400";
      case "CAUTION":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case "BUILD":
        return "BUILD IT ✅";
      case "BAIL":
        return "BAIL 💀";
      case "CAUTION":
        return "PROCEED WITH CAUTION";
      default:
        return verdict;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-green-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const shareOnTwitter = () => {
    const text = `I just saved ${timeSaved} hours by not building a terrible app idea! 💀 Get your ideas brutally analyzed at BuildOrBail`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid opacity-20"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl floating-animation"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      
      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="gradient-text neon-text">BuildOrBail</span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-200 font-bold mb-2">
              Brutally Honest Feedback + Actionable Improvement Tips
            </p>
            <p className="text-xl text-gray-300 mt-4 max-w-4xl mx-auto leading-relaxed">
              Get snarky reality checks on your app ideas, then discover exactly how to transform them into BUILD-worthy projects
            </p>
            
            {/* Navigation Links */}
            <div className="flex justify-center gap-6 mt-8">
              <a 
                href="/admin" 
                className="glass-card px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:neon-glow flex items-center gap-2"
              >
                <span className="text-purple-400">📊</span> Analytics Dashboard
              </a>
              <a 
                href="/wall-of-shame" 
                className="glass-card px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:neon-glow flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-pink-500/20"
              >
                <span className="text-red-400">💀</span> Wall of Shame
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Section */}
      {!currentResult && (
        <section id="form-section" className="py-20 relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-8 md:p-12 pulse-glow">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xl font-bold gradient-text mb-4 block">
                          What's your app called?
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Give your revolutionary idea a name..." 
                            className="glass-card border-white/20 text-white placeholder-gray-400 text-lg p-6 focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all duration-300"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xl font-bold gradient-text mb-4 block">
                          Describe your app idea in detail
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paint the vision. What problem does it solve? What makes it special? Be thorough..." 
                            rows={6}
                            className="glass-card border-white/20 text-white placeholder-gray-400 text-lg p-6 resize-none focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all duration-300"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="targetMarket"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-bold gradient-text mb-3 block">
                            What's your target audience?
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Be specific. Demographics, psychographics, use cases..." 
                              className="glass-card border-white/20 text-white placeholder-gray-400 text-lg p-4 focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all duration-300"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-bold gradient-text mb-3 block">
                            How will you monetize?
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Freemium? Subscriptions? One-time? Commission?" 
                              className="glass-card border-white/20 text-white placeholder-gray-400 text-lg p-4 focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all duration-300"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="glass-card p-6 border border-white/20">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        defaultChecked={true}
                        className="mt-1 h-6 w-6 rounded border-purple-500 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="space-y-2 leading-none">
                        <label htmlFor="agreeToTerms" className="gradient-text font-bold text-lg cursor-pointer">
                          I want AI-powered brutal honesty
                        </label>
                        <p className="text-gray-300 text-sm">
                          I understand this analysis will be comprehensive and might challenge my assumptions. I'm ready for unfiltered insights.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-8">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-2xl px-16 py-8 rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 neon-glow"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent mr-4"></div>
                          ANALYZING WITH AI...
                        </>
                      ) : (
                        "BUILD OR BAIL"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <section className="py-20 relative z-10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-card p-12 rounded-3xl pulse-glow">
              <div className="animate-spin rounded-full h-24 w-24 border-4 border-white/20 border-t-purple-500 mx-auto mb-8"></div>
              <h3 className="text-4xl font-bold gradient-text mb-6 neon-text">{loadingMessage}</h3>
              <div className="bg-white/10 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
              <p className="text-gray-300 mt-6 text-xl">AI is analyzing your concept...</p>
            </div>
          </div>
        </section>
      )}

      {/* Results Section with Dramatic Animations */}
      {currentResult && showResults && (
        <section id="results" className="py-20 min-h-screen relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Main Verdict with Dramatic Animation */}
            <div className={`text-center mb-16 transition-all duration-1000 ${animateVerdict ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className={`glass-card p-12 rounded-3xl ${currentResult.verdict === 'BAIL' ? 'border-red-500 neon-glow bg-red-500/10' : 'border-green-500 neon-glow bg-green-500/10'}`}>
                <h2 className={`text-7xl md:text-9xl font-black mb-6 ${getVerdictColor(currentResult.verdict)} neon-text floating-animation`}>
                  {getVerdictText(currentResult.verdict)}
                </h2>
                {currentResult.verdict === 'BAIL' && (
                  <div className="text-4xl mb-4 animate-pulse">
                    💀 REALITY SLAP 💀
                  </div>
                )}
              </div>
              
              {/* Score Visualization with Progress Bar */}
              <div className="mt-8 max-w-md mx-auto">
                <div className="text-3xl font-bold text-white mb-4">
                  Brutal Score: {currentResult.score.toFixed(1)}/10
                </div>
                <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-2000 ease-out ${getScoreColor(currentResult.score)}`}
                    style={{ width: `${(currentResult.score / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Time Saved Celebration */}
              <div className="mt-8 bg-yellow-900/50 border-2 border-yellow-500 rounded-xl p-6 max-w-md mx-auto animate-pulse">
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  🎉 TIME SAVED: {timeSaved} HOURS 🎉
                </div>
                <p className="text-yellow-200 text-lg">
                  Congratulations! You avoided a coding disaster.
                </p>
                <button 
                  onClick={shareOnTwitter}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all"
                >
                  📱 Share Your Escape
                </button>
              </div>
            </div>

            {/* Flip Card Analysis Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 px-4">
              
              {/* Market Reality Flip Card */}
              <div className={`flip-card ${flipCards[0] ? 'flipped' : ''}`} onClick={() => setFlipCards([!flipCards[0], flipCards[1], flipCards[2], flipCards[3]])}>
                <div className="flip-card-inner">
                  <div className="flip-card-front glass-card border-white/20 p-8 cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="text-6xl mb-6">📊</div>
                      <h3 className="text-2xl font-bold gradient-text mb-3">Market Reality</h3>
                      <p className="text-gray-300">Click to reveal analysis</p>
                    </div>
                  </div>
                  <div className="flip-card-back glass-card border-red-400/50 bg-red-500/10 p-8">
                    <div className="h-full flex flex-col">
                      <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center justify-between">
                        <span>📊 Market Reality</span>
                        <span className="text-2xl neon-text">
                          {(currentResult as any).brutalAnalysis?.market_reality?.score || Math.floor(currentResult.score)}/10
                        </span>
                      </h3>
                      <div className="text-gray-200 text-sm leading-relaxed overflow-y-auto flex-1">
                        {(currentResult as any).brutalAnalysis?.market_reality?.analysis || currentResult.detailedAnalysis.split('\n\n')[0]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Competition Crusher Flip Card */}
              <div className={`flip-card ${flipCards[1] ? 'flipped' : ''}`} onClick={() => setFlipCards([flipCards[0], !flipCards[1], flipCards[2], flipCards[3]])}>
                <div className="flip-card-inner">
                  <div className="flip-card-front glass-card border-white/20 p-8 cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="text-6xl mb-6">⚔️</div>
                      <h3 className="text-2xl font-bold gradient-text mb-3">Competition Analysis</h3>
                      <p className="text-gray-300">Click to reveal analysis</p>
                    </div>
                  </div>
                  <div className="flip-card-back glass-card border-orange-400/50 bg-orange-500/10 p-8">
                    <div className="h-full flex flex-col">
                      <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center justify-between">
                        <span>⚔️ Competition Crusher</span>
                        <span className="text-2xl neon-text">
                          {(currentResult as any).brutalAnalysis?.competition_analysis?.score || Math.floor(currentResult.score * 0.8)}/10
                        </span>
                      </h3>
                      <div className="text-gray-200 text-sm leading-relaxed overflow-y-auto flex-1">
                        {(currentResult as any).brutalAnalysis?.competition_analysis?.analysis || "Your competition will destroy you. Everyone has thought of this already."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Difficulty Bomb */}
              <div className={`flip-card ${flipCards[2] ? 'flipped' : ''}`} onClick={() => setFlipCards([flipCards[0], flipCards[1], !flipCards[2], flipCards[3]])}>
                <div className="flip-card-inner">
                  <div className="flip-card-front glass-card border-white/20 p-8 cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="text-6xl mb-6">💣</div>
                      <h3 className="text-2xl font-bold gradient-text mb-3">Technical Feasibility</h3>
                      <p className="text-gray-300">Click to reveal analysis</p>
                    </div>
                  </div>
                  <div className="flip-card-back glass-card border-yellow-400/50 bg-yellow-500/10 p-8">
                    <div className="h-full flex flex-col">
                      <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center justify-between">
                        <span>💣 Technical Bomb</span>
                        <span className="text-2xl neon-text">
                          {(currentResult as any).brutalAnalysis?.technical_feasibility?.score || Math.floor(currentResult.score * 0.9)}/10
                        </span>
                      </h3>
                      <div className="text-gray-200 text-sm leading-relaxed overflow-y-auto flex-1">
                        {(currentResult as any).brutalAnalysis?.technical_feasibility?.analysis || "The technical challenges will crush you before you even start."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monetization Reality Check */}
              <div className={`flip-card ${flipCards[3] ? 'flipped' : ''}`} onClick={() => setFlipCards([flipCards[0], flipCards[1], flipCards[2], !flipCards[3]])}>
                <div className="flip-card-inner">
                  <div className="flip-card-front glass-card border-white/20 p-8 cursor-pointer hover:scale-105 transition-transform duration-300">
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="text-6xl mb-6">💸</div>
                      <h3 className="text-2xl font-bold gradient-text mb-3">Monetization Reality</h3>
                      <p className="text-gray-300">Click to reveal analysis</p>
                    </div>
                  </div>
                  <div className="flip-card-back glass-card border-green-400/50 bg-green-500/10 p-8">
                    <div className="h-full flex flex-col">
                      <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center justify-between">
                        <span>💸 Money Reality</span>
                        <span className="text-2xl neon-text">
                          {(currentResult as any).brutalAnalysis?.monetization_reality?.score || Math.floor(currentResult.score * 0.7)}/10
                        </span>
                      </h3>
                      <div className="text-gray-200 text-sm leading-relaxed overflow-y-auto flex-1">
                        {(currentResult as any).brutalAnalysis?.monetization_reality?.analysis || "Your monetization plan is fantasy. Nobody will pay for this."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fatal Flaws Warning Banner */}
            {((currentResult as any).brutalAnalysis?.fatal_flaws?.length > 0 || currentResult.weaknesses.length > 0) && (
              <div className="glass-card border-red-400/50 bg-red-500/10 p-8 mb-8 pulse-glow">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">⚠️ Critical Issues Detected ⚠️</div>
                  <h3 className="text-3xl font-bold gradient-text">
                    Your Idea Has Terminal Problems
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {((currentResult as any).brutalAnalysis?.fatal_flaws || currentResult.weaknesses).map((flaw: string, index: number) => (
                    <div key={index} className="glass-card border-red-400/30  p-4 flex items-start space-x-3">
                      <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold flex-shrink-0 floating-animation">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-red-300 font-bold text-sm">FATAL FLAW #{index + 1}</div>
                        <span className="text-gray-200">{flaw}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example Brutal Responses */}
            <div className="bg-gray-800/50 border-2 border-gray-600 rounded-xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
                🔥 EXAMPLES OF BRUTAL VERDICTS 🔥
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                  <div className="text-red-400 font-bold mb-2">BAIL 💀</div>
                  <div className="text-sm text-gray-300">
                    "Your 'revolutionary' social media app is just Twitter with extra steps. 2,847 others had this idea last week."
                  </div>
                </div>
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                  <div className="text-red-400 font-bold mb-2">BAIL 💀</div>
                  <div className="text-sm text-gray-300">
                    "A blockchain-powered pet rock NFT marketplace? The 2021 gold rush is over. You're 3 years late to the grave."
                  </div>
                </div>
                <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
                  <div className="text-green-400 font-bold mb-2">BUILD ✅</div>
                  <div className="text-sm text-gray-300">
                    "Healthcare automation with proven ROI and regulatory approval path. Finally, someone with a brain."
                  </div>
                </div>
              </div>
            </div>

            {/* Show Action Plan Button - Only show for BAIL verdicts */}
            {currentResult.verdict === "BAIL" && !showActionPlan && (
              <div className="text-center mb-12">
                <Button 
                  onClick={() => setShowActionPlan(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-xl px-12 py-6 rounded-lg transform transition-all hover:scale-105 shadow-lg neon-glow"
                >
                  🚀 Show Me How to Fix This
                </Button>
                <p className="text-green-400 mt-4 text-lg font-semibold">
                  Every great app started with a terrible first idea
                </p>
              </div>
            )}

            {/* Constructive Action Plan Section */}
            {showActionPlan && (
              <div className="mt-16 animate-fade-in">
                {/* Header */}
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black gradient-text neon-text mb-4">
                    🌟 Don't Give Up - Here's How to Fix It
                  </h2>
                  <p className="text-green-300 text-lg">
                    Transform your idea from BAIL to BUILD with these actionable steps
                  </p>
                </div>

                {/* Action Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  
                  {/* Actionable Steps Card */}
                  <div className={`glass-card border-green-400/50 bg-green-500/10 p-8 cursor-pointer transition-all duration-300 ${expandedActionCard === 'steps' ? 'scale-105' : ''}`} 
                       onClick={() => setExpandedActionCard(expandedActionCard === 'steps' ? null : 'steps')}>
                    <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
                      <span className="text-3xl mr-3">✅</span>
                      Actionable Steps
                    </h3>
                    <div className={`transition-all duration-300 ${expandedActionCard === 'steps' ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'}`}>
                      <ul className="space-y-3 text-gray-200">
                        {((currentResult as any).brutalAnalysis?.actionable_steps || []).map((step: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-green-300 text-sm mt-4">
                      {expandedActionCard === 'steps' ? '↑ Click to collapse' : '↓ Click to expand'}
                    </p>
                  </div>

                  {/* Differentiation Strategy Card */}
                  <div className={`glass-card border-blue-400/50 bg-blue-500/10 p-8 cursor-pointer transition-all duration-300 ${expandedActionCard === 'differentiation' ? 'scale-105' : ''}`} 
                       onClick={() => setExpandedActionCard(expandedActionCard === 'differentiation' ? null : 'differentiation')}>
                    <h3 className="text-2xl font-bold text-blue-400 mb-6 flex items-center">
                      <span className="text-3xl mr-3">🚀</span>
                      Differentiation Strategy
                    </h3>
                    <div className={`transition-all duration-300 ${expandedActionCard === 'differentiation' ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'}`}>
                      <p className="text-gray-200 leading-relaxed">
                        {(currentResult as any).brutalAnalysis?.differentiation_strategy || "Strategy advice not available"}
                      </p>
                    </div>
                    <p className="text-blue-300 text-sm mt-4">
                      {expandedActionCard === 'differentiation' ? '↑ Click to collapse' : '↓ Click to expand'}
                    </p>
                  </div>

                  {/* Pivot Suggestions Card */}
                  <div className={`glass-card border-purple-400/50 bg-purple-500/10 p-8 cursor-pointer transition-all duration-300 ${expandedActionCard === 'pivot' ? 'scale-105' : ''}`} 
                       onClick={() => setExpandedActionCard(expandedActionCard === 'pivot' ? null : 'pivot')}>
                    <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center">
                      <span className="text-3xl mr-3">🔄</span>
                      Pivot Options
                    </h3>
                    <div className={`transition-all duration-300 ${expandedActionCard === 'pivot' ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'}`}>
                      <ul className="space-y-3 text-gray-200">
                        {((currentResult as any).brutalAnalysis?.pivot_suggestions || []).map((pivot: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span>{pivot}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-purple-300 text-sm mt-4">
                      {expandedActionCard === 'pivot' ? '↑ Click to collapse' : '↓ Click to expand'}
                    </p>
                  </div>

                  {/* Validation Plan Card */}
                  <div className={`glass-card border-orange-400/50 bg-orange-500/10 p-8 cursor-pointer transition-all duration-300 ${expandedActionCard === 'validation' ? 'scale-105' : ''}`} 
                       onClick={() => setExpandedActionCard(expandedActionCard === 'validation' ? null : 'validation')}>
                    <h3 className="text-2xl font-bold text-orange-400 mb-6 flex items-center">
                      <span className="text-3xl mr-3">🔍</span>
                      Validation Plan
                    </h3>
                    <div className={`transition-all duration-300 ${expandedActionCard === 'validation' ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'}`}>
                      <ul className="space-y-3 text-gray-200">
                        {((currentResult as any).brutalAnalysis?.validation_steps || []).map((step: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-orange-300 text-sm mt-4">
                      {expandedActionCard === 'validation' ? '↑ Click to collapse' : '↓ Click to expand'}
                    </p>
                  </div>
                </div>

                {/* Save Action Plan Button */}
                <div className="text-center mb-8">
                  <Button 
                    onClick={() => {
                      const actionPlan = {
                        idea: currentResult.appIdea.appName,
                        actionable_steps: (currentResult as any).brutalAnalysis?.actionable_steps || [],
                        differentiation_strategy: (currentResult as any).brutalAnalysis?.differentiation_strategy || "",
                        pivot_suggestions: (currentResult as any).brutalAnalysis?.pivot_suggestions || [],
                        validation_steps: (currentResult as any).brutalAnalysis?.validation_steps || []
                      };
                      
                      const blob = new Blob([JSON.stringify(actionPlan, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${currentResult.appIdea.appName.replace(/\s+/g, '_')}_action_plan.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      
                      toast({
                        title: "Action Plan Saved!",
                        description: "Your improvement plan has been downloaded. Time to get building!"
                      });
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-lg px-8 py-3 rounded-lg transform transition-all hover:scale-105 shadow-lg"
                  >
                    💾 Save My Action Plan
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <div className="space-x-4">
                <Button 
                  onClick={handleValidateAnother}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-4 rounded-lg transform transition-all hover:scale-105 shadow-lg"
                >
                  💀 Try Another Idea
                </Button>
                <Button 
                  onClick={shareOnTwitter}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-8 py-4 rounded-lg transform transition-all hover:scale-105 shadow-lg"
                >
                  📱 Share Your Escape
                </Button>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                BuildOrBail has saved entrepreneurs over 50,000 hours of wasted development time
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
