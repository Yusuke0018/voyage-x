import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TodayCompass } from '@/components/dashboard/TodayCompass';
import { EmotionLog } from '@/components/dashboard/EmotionLog';
import { ProgressSummary } from '@/components/dashboard/ProgressSummary';

export default function Dashboard() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Voyage - 航海日誌</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 今日の羅針盤 */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>今日の羅針盤</CardTitle>
          </CardHeader>
          <CardContent>
            <TodayCompass />
          </CardContent>
        </Card>
        
        {/* 感情ログ */}
        <Card>
          <CardHeader>
            <CardTitle>今日の天候</CardTitle>
          </CardHeader>
          <CardContent>
            <EmotionLog />
          </CardContent>
        </Card>
        
        {/* 進捗サマリー */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>航海進捗</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressSummary />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
