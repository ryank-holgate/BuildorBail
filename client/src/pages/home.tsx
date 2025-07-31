import { useState } from "react";
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
    }).extend({
      agreeToTerms: insertAppIdeaSchema.shape.agreeToTerms
    })),
    defaultValues: {
      appName: "",
      description: "",
      targetMarket: "",
      budget: "",
      agreeToTerms: false,
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (data: any): Promise<ValidationResultWithIdea> => {
      const transformedData = {
        appName: data.appName,
        description: data.description,
        targetMarket: data.targetMarket,
        budget: data.budget,
        agreeToTerms: true,
      };
      
      const response = await apiRequest("POST", "/api/validate", transformedData);
      return response.json();
    },
    onSuccess: (result) => {
      setCurrentResult(result);
      setIsLoading(false);
      setTimeSaved(Math.floor(Math.random() * 120) + 40); // Random between 40-160 hours
      
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
        return "BUILD IT";
      case "BAIL":
        return "BAIL";
      case "CAUTION":
        return "PROCEED WITH CAUTION";
      default:
        return verdict;
    }
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

                  <div className="text-center pt-8">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-6 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          DESTROYING...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-skull-crossbones mr-3"></i>
                          DESTROY MY IDEA
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

      {/* Results Section */}
      {currentResult && (
        <section id="results" className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Verdict */}
            <div className="text-center mb-16">
              <h2 className={`text-6xl md:text-8xl font-black mb-4 ${getVerdictColor(currentResult.verdict)}`}>
                {getVerdictText(currentResult.verdict)}
              </h2>
              <div className="text-4xl font-bold text-white mb-6">
                Score: {currentResult.score.toFixed(1)}/10
              </div>
              <div className="text-2xl text-yellow-400 font-bold">
                🎉 You just saved {timeSaved} hours of coding
              </div>
            </div>

            {/* Analysis Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Market Reality */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
                  <i className="fas fa-chart-line mr-3"></i>
                  Market Reality
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">What's Working:</h4>
                    <ul className="space-y-1">
                      {currentResult.strengths.slice(0, 2).map((strength, index) => (
                        <li key={index} className="text-gray-300">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-400 mb-2">Reality Check:</h4>
                    <ul className="space-y-1">
                      {currentResult.weaknesses.slice(0, 2).map((weakness, index) => (
                        <li key={index} className="text-gray-300">• {weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Competition Analysis */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
                  <i className="fas fa-sword mr-3"></i>
                  Competition Analysis
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-yellow-400 mb-2">Your Edge:</h4>
                    <ul className="space-y-1">
                      {currentResult.opportunities.slice(0, 2).map((opportunity, index) => (
                        <li key={index} className="text-gray-300">• {opportunity}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-400 mb-2">Threats:</h4>
                    <ul className="space-y-1">
                      {currentResult.weaknesses.slice(2, 4).map((weakness, index) => (
                        <li key={index} className="text-gray-300">• {weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Technical Feasibility */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
                  <i className="fas fa-cogs mr-3"></i>
                  Technical Feasibility
                </h3>
                <div className="text-gray-300">
                  <p>{currentResult.detailedAnalysis.substring(0, 200)}...</p>
                </div>
              </div>

              {/* Monetization Reality */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
                  <i className="fas fa-dollar-sign mr-3"></i>
                  Monetization Reality
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">Revenue Potential:</h4>
                    <ul className="space-y-1">
                      {currentResult.opportunities.slice(2, 4).map((opportunity, index) => (
                        <li key={index} className="text-gray-300">• {opportunity}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-400 mb-2">Money Problems:</h4>
                    <ul className="space-y-1">
                      {currentResult.weaknesses.slice(4, 6).map((weakness, index) => (
                        <li key={index} className="text-gray-300">• {weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Items */}
            {currentResult.actionItems.length > 0 && (
              <div className="bg-gray-800 border border-red-600 rounded-xl p-8 mb-8">
                <h3 className="text-2xl font-bold text-red-400 mb-6">What To Do Next</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentResult.actionItems.map((action, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-gray-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center">
              <Button 
                onClick={handleValidateAnother}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-4 rounded-lg"
              >
                <i className="fas fa-redo mr-3"></i>
                Destroy Another Idea
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
