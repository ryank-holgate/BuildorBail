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
              AI-Powered Idea Validation
            </p>
            <p className="text-xl text-gray-300 mt-4 max-w-4xl mx-auto leading-relaxed">
              Get brutally honest feedback on your app ideas before you waste time building something nobody wants
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
                        <>
                          <span className="mr-3">🚀</span>
                          VALIDATE MY IDEA
                          <span className="ml-3">🚀</span>
                        </>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              
              {/* Market Reality Flip Card */}
              <div className={`flip-card h-80 ${flipCards[0] ? 'flipped' : ''}`}>
                <div className="flip-card-inner">
                  <div className="flip-card-front bg-gray-800 border-2 border-gray-600 rounded-xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-2xl font-bold text-red-400">Market Reality</h3>
                      <p className="text-gray-400 mt-2">Click to reveal the harsh truth</p>
                    </div>
                  </div>
                  <div className="flip-card-back bg-red-900 border-2 border-red-500 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center justify-between">
                      <span>📊 Market Reality</span>
                      <span className="text-2xl">
                        {(currentResult as any).brutalAnalysis?.market_reality?.score || Math.floor(currentResult.score)}/10
                      </span>
                    </h3>
                    <div className="text-gray-200 text-sm leading-relaxed">
                      {(currentResult as any).brutalAnalysis?.market_reality?.analysis || currentResult.detailedAnalysis.split('\n\n')[0]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Competition Crusher Flip Card */}
              <div className={`flip-card h-80 ${flipCards[1] ? 'flipped' : ''}`}>
                <div className="flip-card-inner">
                  <div className="flip-card-front bg-gray-800 border-2 border-gray-600 rounded-xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">⚔️</div>
                      <h3 className="text-2xl font-bold text-red-400">Competition Crusher</h3>
                      <p className="text-gray-400 mt-2">Your idea isn't unique</p>
                    </div>
                  </div>
                  <div className="flip-card-back bg-red-900 border-2 border-red-500 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center justify-between">
                      <span>⚔️ Competition Crusher</span>
                      <span className="text-2xl">
                        {(currentResult as any).brutalAnalysis?.competition_analysis?.score || Math.floor(currentResult.score * 0.8)}/10
                      </span>
                    </h3>
                    <div className="text-gray-200 text-sm leading-relaxed">
                      {(currentResult as any).brutalAnalysis?.competition_analysis?.analysis || "Your competition will destroy you. Everyone has thought of this already."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Difficulty Bomb */}
              <div className={`flip-card h-80 ${flipCards[2] ? 'flipped' : ''}`}>
                <div className="flip-card-inner">
                  <div className="flip-card-front bg-gray-800 border-2 border-gray-600 rounded-xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💣</div>
                      <h3 className="text-2xl font-bold text-red-400">Technical Difficulty Bomb</h3>
                      <p className="text-gray-400 mt-2">Can you even build this?</p>
                    </div>
                  </div>
                  <div className="flip-card-back bg-red-900 border-2 border-red-500 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center justify-between">
                      <span>💣 Technical Bomb</span>
                      <span className="text-2xl">
                        {(currentResult as any).brutalAnalysis?.technical_feasibility?.score || Math.floor(currentResult.score * 0.9)}/10
                      </span>
                    </h3>
                    <div className="text-gray-200 text-sm leading-relaxed">
                      {(currentResult as any).brutalAnalysis?.technical_feasibility?.analysis || "The technical challenges will crush you before you even start."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monetization Reality Check */}
              <div className={`flip-card h-80 ${flipCards[3] ? 'flipped' : ''}`}>
                <div className="flip-card-inner">
                  <div className="flip-card-front bg-gray-800 border-2 border-gray-600 rounded-xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💸</div>
                      <h3 className="text-2xl font-bold text-red-400">Monetization Reality</h3>
                      <p className="text-gray-400 mt-2">How will you make money?</p>
                    </div>
                  </div>
                  <div className="flip-card-back bg-red-900 border-2 border-red-500 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center justify-between">
                      <span>💸 Money Reality</span>
                      <span className="text-2xl">
                        {(currentResult as any).brutalAnalysis?.monetization_reality?.score || Math.floor(currentResult.score * 0.7)}/10
                      </span>
                    </h3>
                    <div className="text-gray-200 text-sm leading-relaxed">
                      {(currentResult as any).brutalAnalysis?.monetization_reality?.analysis || "Your monetization plan is fantasy. Nobody will pay for this."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fatal Flaws Warning Banner */}
            {((currentResult as any).brutalAnalysis?.fatal_flaws?.length > 0 || currentResult.weaknesses.length > 0) && (
              <div className="bg-red-900/80 border-4 border-red-500 rounded-xl p-8 mb-8 animate-pulse">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">☠️ FATAL FLAWS DETECTED ☠️</div>
                  <h3 className="text-3xl font-bold text-red-400">
                    Your Idea Has Terminal Problems
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {((currentResult as any).brutalAnalysis?.fatal_flaws || currentResult.weaknesses).map((flaw: string, index: number) => (
                    <div key={index} className="bg-red-800/50 border-2 border-red-400 rounded-lg p-4 flex items-start space-x-3">
                      <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold flex-shrink-0 animate-bounce">
                        💀
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
