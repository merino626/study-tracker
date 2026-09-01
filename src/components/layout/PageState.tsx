import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PageStateProps {
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export function PageState({ loading, error, children, className }: PageStateProps) {
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-muted h-24 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive/30', className)}>
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="text-destructive size-5 shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
