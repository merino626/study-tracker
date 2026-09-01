import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDurationShort } from '@/utils/time';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  description?: string;
  valueSeconds: number;
  className?: string;
}

export function StatsCard({ title, description, valueSeconds, className }: StatsCardProps) {
  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {formatDurationShort(valueSeconds)}
        </CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-muted-foreground text-xs">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}
