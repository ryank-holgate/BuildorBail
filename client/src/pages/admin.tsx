import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  totalIdeasAnalyzed: number;
  totalBuildVerdicts: number;
  totalBailVerdicts: number;
  totalTimeSaved: number;
  averageScore: number;
  buildBailRatio: string;
}

export default function AdminDashboard() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-400">Loading brutal analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Analytics Failed</h1>
            <p className="text-gray-400">Could not load analytics data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black border-b border-red-600">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-red-400">💀 ADMIN DASHBOARD</h1>
              <p className="text-gray-400 mt-2">Monitoring the carnage since day one</p>
            </div>
            <a 
              href="/" 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
            >
              ← Back to Destruction
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-400 text-lg">Total Ideas Destroyed</CardTitle>
              <CardDescription className="text-gray-400">Dreams crushed since launch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white">{analytics.totalIdeasAnalyzed.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-400 text-lg">BUILD vs BAIL Ratio</CardTitle>
              <CardDescription className="text-gray-400">Success rate (spoiler: it's brutal)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white">{analytics.buildBailRatio}</div>
              <div className="text-sm text-gray-400 mt-2">
                {analytics.totalBuildVerdicts > 0 
                  ? `${((analytics.totalBuildVerdicts / analytics.totalIdeasAnalyzed) * 100).toFixed(1)}% BUILD rate`
                  : "No ideas worth building yet"
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400 text-lg">Time Saved</CardTitle>
              <CardDescription className="text-gray-400">Developer hours rescued</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white">{analytics.totalTimeSaved.toLocaleString()}</div>
              <div className="text-sm text-gray-400 mt-2">
                Hours not wasted on garbage
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-red-400">Verdict Breakdown</CardTitle>
              <CardDescription className="text-gray-400">How brutal we've been</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-red-400 font-bold">💀 BAIL Verdicts</span>
                <span className="text-2xl font-black text-white">{analytics.totalBailVerdicts}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full" 
                  style={{ 
                    width: analytics.totalIdeasAnalyzed > 0 
                      ? `${(analytics.totalBailVerdicts / analytics.totalIdeasAnalyzed) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-green-400 font-bold">✅ BUILD Verdicts</span>
                <span className="text-2xl font-black text-white">{analytics.totalBuildVerdicts}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full" 
                  style={{ 
                    width: analytics.totalIdeasAnalyzed > 0 
                      ? `${(analytics.totalBuildVerdicts / analytics.totalIdeasAnalyzed) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-400">Quality Metrics</CardTitle>
              <CardDescription className="text-gray-400">Average scores and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Average Brutal Score</span>
                <span className="text-3xl font-black text-white">{analytics.averageScore.toFixed(1)}/10</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full" 
                  style={{ width: `${(analytics.averageScore / 10) * 100}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-400 mt-4 space-y-2">
                <p>• {analytics.totalTimeSaved > 0 
                  ? `${Math.round(analytics.totalTimeSaved / analytics.totalIdeasAnalyzed)} avg hours saved per idea`
                  : "No time saved data yet"
                }</p>
                <p>• {analytics.totalIdeasAnalyzed > 100 
                  ? "Enough data for reliable statistics" 
                  : "Still gathering brutal insights"
                }</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-red-400 mb-4">Quick Navigation</h3>
          <div className="flex gap-4 flex-wrap">
            <a 
              href="/wall-of-shame" 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              💀 View Wall of Shame
            </a>
            <a 
              href="/" 
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              🔥 Destroy More Ideas
            </a>
          </div>
        </div>

        {/* Footer Stats */}
        {analytics.totalIdeasAnalyzed > 0 && (
          <div className="mt-8 text-center text-gray-400">
            <p className="text-sm">
              BuildOrBail has prevented {analytics.totalBailVerdicts} terrible apps from being built, 
              saving entrepreneurs {analytics.totalTimeSaved.toLocaleString()} hours of wasted development time.
            </p>
            <p className="text-xs mt-2 text-red-400">
              Only {analytics.totalBuildVerdicts} ideas were worth building. That's brutal honesty.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}