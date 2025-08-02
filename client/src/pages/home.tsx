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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              <span className="text-red-500">BuildOrBail</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-bold">
              The Brutally Honest App Idea Validator
            </p>
            <p className="text-lg text-gray-400 mt-4 max-w-3xl mx-auto">
              We'll tell you the harsh truth about your app idea so you don't waste weeks building garbage
            </p>
            
            {/* Navigation Links */}
            <div className="flex justify-center gap-4 mt-6">
              <a 
                href="/admin" 
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-colors border border-gray-600"
              >
                📊 Analytics Dashboard
              </a>
              <a 
                href="/wall-of-shame" 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                💀 Wall of Shame
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Section */}
      {!currentResult && (
        <section id="form-section" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 md:p-12">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xl font-bold text-red-400 mb-4 block">
                          What's your app called?
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Give your doomed idea a name..." 
                            className="bg-gray-900 border-gray-600 text-white placeholder-gray-500 text-lg p-4 focus:border-red-500 focus:ring-red-500"
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
                        <FormLabel className="text-xl font-bold text-red-400 mb-4 block">
                          Describe your app idea in detail
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Spill everything. What does it do? Why would anyone care? Don't hold back..." 
                            rows={6}
                            className="bg-gray-900 border-gray-600 text-white placeholder-gray-500 text-lg p-6 resize-none focus:border-red-500 focus:ring-red-500"
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
                          <FormLabel className="text-lg font-bold text-red-400 mb-3 block">
                            What's your target audience?
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Be specific. 'Everyone' is not an answer." 
                              className="bg-gray-900 border-gray-600 text-white placeholder-gray-500 text-lg p-4 focus:border-red-500 focus:ring-red-500"
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
                          <FormLabel className="text-lg font-bold text-red-400 mb-3 block">
                            How will you make money?
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ads? Subscriptions? Magic?" 
                              className="bg-gray-900 border-gray-600 text-white placeholder-gray-500 text-lg p-4 focus:border-red-500 focus:ring-red-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-md border border-gray-600 p-6 bg-gray-900">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        defaultChecked={true}
                        className="mt-1 h-5 w-5 rounded border-red-500 bg-gray-800 text-red-600 focus:ring-red-500 focus:ring-2"
                      />
                      <div className="space-y-1 leading-none">
                        <label htmlFor="agreeToTerms" className="text-red-400 font-bold text-lg cursor-pointer">
                          I want brutally honest feedback
                        </label>
                        <p className="text-gray-400 text-sm">
                          I understand this analysis will be harsh and might crush my dreams. I'm ready for the truth.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-8">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-6 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          ANALYZING...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-skull-crossbones mr-3"></i>
                          BUILD OR BAIL
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
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-600 border-t-red-500 mx-auto mb-8"></div>
            <h3 className="text-3xl font-bold text-red-400 mb-6">{loadingMessage}</h3>
            <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
              <div className="bg-red-500 h-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
            <p className="text-gray-400 mt-4 text-lg">This might hurt...</p>
          </div>
        </section>
      )}

      {/* Results Section with Dramatic Animations */}
      {currentResult && showResults && (
        <section id="results" className="py-20 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Main Verdict with Dramatic Animation */}
            <div className={`text-center mb-16 transition-all duration-1000 ${animateVerdict ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className={`inline-block p-8 rounded-2xl ${currentResult.verdict === 'BAIL' ? 'bg-red-900/50 border-4 border-red-500 animate-pulse' : 'bg-green-900/50 border-4 border-green-500'}`}>
                <h2 className={`text-7xl md:text-9xl font-black mb-6 ${getVerdictColor(currentResult.verdict)} animate-bounce`}>
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
