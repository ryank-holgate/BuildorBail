import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ShameEntry {
  id: string;
  rank: number;
  appName: string;
  description: string;
  targetMarket: string;
  score: number;
  verdict: string;
  topWeaknesses: string[];
  createdAt: string;
  timeSaved: number;
}

export default function WallOfShame() {
  const { data: shameList, isLoading, error } = useQuery<ShameEntry[]>({
    queryKey: ['/api/wall-of-shame'],
    queryFn: async () => {
      console.log('Fetching wall of shame data...');
      const res = await fetch('/api/wall-of-shame?limit=30');
      console.log('Response status:', res.status);
      if (!res.ok) {
        console.error('API error:', res.status, res.statusText);
        throw new Error(`Failed to fetch wall of shame: ${res.status}`);
      }
      const data = await res.json();
      console.log('Raw API response:', data);
      console.log('Is array?', Array.isArray(data));
      console.log('Data length:', data?.length);
      return Array.isArray(data) ? data : [];
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-400">Loading the hall of terrible ideas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Wall of Shame error:', error);
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Wall of Shame Unavailable</h1>
            <p className="text-gray-400">Could not load the terrible ideas</p>
            <p className="text-gray-500 text-sm mt-2">Error: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Even if shameList is undefined, let's show the interface
  console.log('Final shameList state:', shameList, 'Loading:', isLoading, 'Error:', error);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid opacity-20"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/20 rounded-full blur-3xl floating-animation"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      
      {/* Header */}
      <div className="relative z-10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black gradient-text neon-text">Wall of Shame</h1>
              <p className="text-gray-300 mt-3 text-lg">
                Case studies from unsuccessful validations • {shameList?.length || 0} learning opportunities
              </p>
            </div>
            <div className="flex gap-4">
              <a 
                href="/" 
                className="glass-card px-4 py-2 rounded-xl font-bold transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-500/20 to-pink-500/20"
              >
                ← Validate New Idea
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Stats Banner */}
        <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-black text-red-400">{shameList?.length || 0}</div>
              <div className="text-gray-300">Terrible Ideas</div>
            </div>
            <div>
              <div className="text-3xl font-black text-yellow-400">
                {(shameList || []).reduce((sum, entry) => sum + (entry.timeSaved || 0), 0).toLocaleString()}
              </div>
              <div className="text-gray-300">Hours Saved</div>
            </div>
            <div>
              <div className="text-3xl font-black text-green-400">
                {(shameList?.length || 0) > 0 
                  ? ((shameList || []).reduce((sum, entry) => sum + (entry.score || 0), 0) / (shameList?.length || 1)).toFixed(1)
                  : "0"
                }
              </div>
              <div className="text-gray-300">Avg Brutal Score</div>
            </div>
          </div>
        </div>

        {/* Shame List */}
        <div className="space-y-6">
          {(shameList?.length || 0) === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">No Terrible Ideas Yet</h3>
              <p className="text-gray-500">Surprisingly, all submitted ideas have been... decent?</p>
            </div>
          ) : (
            (shameList || []).map((entry) => (
              <Card key={entry.id} className="bg-gray-800 border-red-900/50 hover:border-red-500 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-red-400 flex items-center gap-3">
                        <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">
                          #{entry.rank}
                        </span>
                        {entry.appName}
                        <span className="text-red-500 text-2xl">💀</span>
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-2">
                        Target: {entry.targetMarket} • Score: {entry.score}/10 • 
                        Saved {entry.timeSaved} hours of wasted coding
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-300 mb-2">The Terrible Idea:</h4>
                      <p className="text-gray-400 leading-relaxed">{entry.description}</p>
                    </div>
                    
                    {entry.topWeaknesses.length > 0 && (
                      <div>
                        <h4 className="font-bold text-red-400 mb-2">💀 Fatal Flaws:</h4>
                        <ul className="space-y-2">
                          {entry.topWeaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-red-500 text-lg">•</span>
                              <span className="text-gray-300">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-4">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {entry.verdict}
                        </span>
                        <span className="text-gray-400 text-sm">
                          Brutal Score: {entry.score}/10
                        </span>
                      </div>
                      <div className="text-yellow-400 font-bold">
                        🎉 {entry.timeSaved}h saved
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">
            All ideas are anonymized. Names and identifying details are removed to protect the innocent (and not-so-innocent).
          </p>
          <p className="text-xs mt-2">
            BuildOrBail: Saving entrepreneurs from themselves since 2025
          </p>
        </div>
      </div>
    </div>
  );
}